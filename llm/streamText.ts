import { ai } from "./client";
import { CHAT_MODEL_ID } from "./constants";
import { processMessages, GeminiContent } from "./utils";
import { executeTool, functionDeclarations } from "./tools/registry";

export interface StreamTextOptions {
  context?: {
    userId: string;
    projectId: string;
  };
  onFinish?: (result: { content: string; reasoning?: string; toolInvocations: any[] }) => Promise<void>;
  abortSignal?: AbortSignal;
}

/**
 * SSE Text Streaming with Tool Calling using Multi-Turn Chat Sessions
 */
export async function streamText(messages: any[], options?: StreamTextOptions) {
  const { context, onFinish, abortSignal } = options || {};

  // Preprocess input messages to match the Google GenAI SDK schema
  const processed = await processMessages(messages);

  // Extract system instruction if present in the messages
  let systemInstruction: string | undefined;
  const filteredContents = processed.filter((msg) => {
    if (msg.role === "system") {
      systemInstruction = msg.parts[0]?.text;
      return false;
    }
    return true;
  });

  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let finalContent = "";
      let finalReasoning = "";
      const finalToolInvocations: any[] = [];

      const sendEvent = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const history = filteredContents.slice(0, -1);
        const lastMessage = filteredContents[filteredContents.length - 1];

        if (!lastMessage) {
          throw new Error("No messages provided for chat session.");
        }

        // Initialize stateful multi-turn conversation session
        const chat = ai.chats.create({
          model: CHAT_MODEL_ID,
          history: history,
          config: {
            tools: [{ functionDeclarations }],
            ...(systemInstruction && { systemInstruction }),
          },
        });

        let nextMessage: any = lastMessage.parts;
        let toolCallsAttempt = 0;

        while (toolCallsAttempt < 10) {
          if (abortSignal?.aborted) break;

          // Stream the next message/response within the stateful conversation
          const responseStream = await chat.sendMessageStream({
            message: nextMessage,
          });

          let assistantContent = "";
          let toolCalls: any[] = [];

          for await (const chunk of responseStream) {
            if (abortSignal?.aborted) break;

            // Stream standard text content
            if (chunk.text) {
              assistantContent += chunk.text;
              finalContent += chunk.text;
              sendEvent({ type: "text", content: chunk.text });
            }

            // Stream reasoning/thought block if supported
            const candidates = chunk.candidates || [];
            for (const candidate of candidates) {
              const parts = candidate.content?.parts || [];
              for (const part of parts) {
                if (part.thought) {
                  finalReasoning += part.thought;
                  sendEvent({ type: "reasoning", content: part.thought });
                }
              }
            }

            // Collect function/tool calls suggested by the model
            const calls = chunk.functionCalls;
            if (calls && calls.length > 0) {
              toolCalls.push(...calls);
            }
          }

          // If the model suggested one or more function calls, execute them and continue the loop
          if (toolCalls.length > 0 && context) {
            toolCallsAttempt++;

            // Execute each tool, stream progress, and construct the responseParts
            const responseParts = [];
            for (const tc of toolCalls) {
              const toolName = tc.name;
              const args = tc.args || {};
              const id = tc.id;

              sendEvent({ type: "tool_call", id, name: toolName, args });

              try {
                const result = await executeTool(toolName, args, context);
                sendEvent({ type: "tool_result", id, name: toolName, result, args });

                finalToolInvocations.push({ toolCallId: id, toolName, args, result });
                responseParts.push({
                  functionResponse: {
                    name: toolName,
                    response: typeof result === "string" ? { result } : result,
                    id,
                  },
                });
              } catch (err: any) {
                const msg = err instanceof Error ? err.message : String(err);
                sendEvent({ type: "tool_result", id, name: toolName, error: msg, args });

                finalToolInvocations.push({ toolCallId: id, toolName, args, result: `Error: ${msg}` });
                responseParts.push({
                  functionResponse: {
                    name: toolName,
                    response: { error: msg },
                    id,
                  },
                });
              }
            }

            // Feed the function responses back in the next turn as the next message
            nextMessage = responseParts;
          } else {
            // No tool calls were returned, generation is complete
            break;
          }
        }
      } catch (err) {
        if (!(err instanceof Error && err.name === "AbortError")) {
          console.error("[streamText] Stream error:", err);
          sendEvent({ type: "error", message: "Internal server error" });
          controller.error(err);
        }
      } finally {
        if (onFinish && (finalContent || finalReasoning || finalToolInvocations.length > 0)) {
          await onFinish({
            content: finalContent,
            reasoning: finalReasoning || undefined,
            toolInvocations: finalToolInvocations,
          });
        }
        controller.close();
      }
    },
  });
}
export default streamText;
