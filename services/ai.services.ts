import * as env from "@/lib/env";
import { 
  CHAT_MODEL_ID 
} from "@/lib/constants";
import { generateScreen as generateScreenTool, getUserCredits as getUserCreditsTool } from "@/llm/tools";

export interface StreamTextOptions {
  context?: {
    userId: string;
    projectId: string;
    notebookId?: string;
  };
  onFinish?: (result: { content: string; reasoning?: string; toolInvocations: any[] }) => Promise<void>;
  abortSignal?: AbortSignal;
}

export interface InferaTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (args: any) => Promise<any>;
}

/**
 * AIService Class
 * Centralizes all AI-related operations with high-fidelity Gateway architecture.
 * Focused only on text generation and streaming.
 */
export class AIService {
  private apiKey: string;
  private gatewayUrl: string;

  constructor() {
    this.apiKey = env.CLOUDFLARE_AI_GATEWAY_API_KEY!;
    this.gatewayUrl = env.CLOUDFLARE_AI_GATEWAY_ENDPOINT!;

    if (!this.apiKey || !this.gatewayUrl) {
      throw new Error(
        "AIService Configuration error: CLOUDFLARE_AI_GATEWAY_API_KEY and CLOUDFLARE_AI_GATEWAY_ENDPOINT must be defined."
      );
    }
  }

  public getGatewayUrl() {
    return this.gatewayUrl;
  }

  /**
   * SSE Text Streaming with Tool Calling
   */
  async streamText(messages: any[], options?: StreamTextOptions) {
    const { context, onFinish, abortSignal } = options || {};
    const toolHandlers = context ? this._createTools(context) : {};
    const tools = Object.values(toolHandlers).length > 0
      ? Object.values(toolHandlers).map((tool) => ({
          type: "function",
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
          },
        }))
      : undefined;

    const url = this.gatewayUrl;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
    };

    if (context?.notebookId) {
      headers["x-session-affinity"] = context.notebookId;
    }

    const history = messages.map((m: any) => ({
      role: m.role,
      content: typeof m.content === "string" ? m.content : "",
      tool_calls: m.tool_calls,
      tool_call_id: m.tool_call_id,
      name: m.name,
    }));

    return new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let finalContent = "";
        let finalReasoning = "";
        const finalToolInvocations: any[] = [];
        const sendEvent = (data: any) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

        try {
          const currentHistory: any[] = [...history];
          let toolCallsAttempt = 0;
          while (toolCallsAttempt < 10) {
            if (abortSignal?.aborted) break;
            const response = await fetch(url, {
              method: "POST",
              headers,
              body: JSON.stringify({ model: CHAT_MODEL_ID, messages: currentHistory, tools, stream: true }),
              signal: abortSignal,
            });

            if (!response.ok) {
              const errorText = await response.text();
              sendEvent({ type: "error", message: `Model error: ${errorText}` });
              break;
            }

            const reader = response.body?.getReader();
            if (!reader) break;

            let assistantContent = "";
            let toolCalls: any[] = [];
            const textDecoder = new TextDecoder();
            let lineBuffer = "";

            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                lineBuffer += textDecoder.decode(value, { stream: true });
                const lines = lineBuffer.split("\n");
                lineBuffer = lines.pop() || "";

                for (const line of lines) {
                  const trimmed = line.trim();
                  if (trimmed.startsWith("data: ") && trimmed !== "data: [DONE]") {
                    try {
                      const data = JSON.parse(trimmed.slice(6));
                      const delta = data.choices?.[0]?.delta;
                      if (!delta) continue;
                      if (delta.reasoning_content) {
                        finalReasoning += delta.reasoning_content;
                        sendEvent({ type: "reasoning", content: delta.reasoning_content });
                      }
                      if (delta.content) {
                        assistantContent += delta.content;
                        finalContent += delta.content;
                        sendEvent({ type: "text", content: delta.content });
                      }
                      if (delta.tool_calls) {
                        delta.tool_calls.forEach((tc: any) => {
                          const idx = tc.index;
                          if (!toolCalls[idx]) {
                            toolCalls[idx] = { 
                              id: tc.id, 
                              type: "function", 
                              function: { name: tc.function.name, arguments: "" } 
                            };
                          }
                          if (tc.function.arguments) {
                            toolCalls[idx].function.arguments += tc.function.arguments;
                          }
                        });
                      }
                    } catch (e) {
                      // Skip invalid JSON
                    }
                  }
                }
              }
            } finally {
              reader.releaseLock();
            }

            toolCalls = toolCalls.filter(Boolean);
            currentHistory.push({ 
              role: "assistant", 
              content: assistantContent || null, 
              tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
            });

            if (toolCalls.length > 0) {
              toolCallsAttempt++;
              for (const tc of toolCalls) {
                const toolName = tc.function.name;
                let args = {};
                try {
                  args = JSON.parse(tc.function.arguments || "{}");
                } catch (e) {
                  console.error("[AIService] Failed to parse tool arguments:", tc.function.arguments);
                }
                
                const tool = toolHandlers[toolName];
                sendEvent({ type: "tool_call", id: tc.id, name: toolName, args });

                if (tool) {
                  try {
                    const result = await tool.execute(args);
                    sendEvent({ type: "tool_result", id: tc.id, result });
                    finalToolInvocations.push({ toolCallId: tc.id, toolName, args, result });
                    currentHistory.push({ 
                      role: "tool", 
                      tool_call_id: tc.id, 
                      name: toolName,
                      content: typeof result === "string" ? result : JSON.stringify(result) 
                    });
                  } catch (err) {
                    const msg = err instanceof Error ? err.message : String(err);
                    sendEvent({ type: "tool_result", id: tc.id, error: msg });
                    finalToolInvocations.push({ toolCallId: tc.id, toolName, args, result: `Error: ${msg}` });
                    currentHistory.push({ 
                      role: "tool", 
                      tool_call_id: tc.id, 
                      name: toolName,
                      content: `Error: ${msg}` 
                    });
                  }
                } else {
                  sendEvent({ type: "tool_result", id: tc.id, error: "Tool not found" });
                  currentHistory.push({ 
                    role: "tool", 
                    tool_call_id: tc.id, 
                    name: toolName,
                    content: "Error: Tool not found" 
                  });
                }
              }
            } else {
              break;
            }
          }
        } catch (err) {
          if (!(err instanceof Error && err.name === "AbortError")) {
            console.error("[AIService] Internal stream error:", err);
            sendEvent({ type: "error", message: "Internal server error" });
            controller.error(err);
          }
        } finally {
          if (onFinish && (finalContent || finalReasoning || finalToolInvocations.length > 0)) {
            await onFinish({ content: finalContent, reasoning: finalReasoning || undefined, toolInvocations: finalToolInvocations });
          }
          controller.close();
        }
      },
    });
  }

  /**
   * Non-streaming Text Generation
   */
  async generateText(
    messages: any[],
    options?: { temperature?: number; max_tokens?: number; notebookId?: string }
  ): Promise<{ text: string }> {
    const { temperature, max_tokens, notebookId } = options || {};

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
    };

    if (notebookId) {
      headers["x-session-affinity"] = notebookId;
    }

    const response = await fetch(this.gatewayUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: CHAT_MODEL_ID,
        messages,
        temperature,
        max_tokens,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI Gateway error: ${await response.text()}`);
    }

    const result = await response.json();
    return { text: result.choices[0].message.content };
  }

  /**
   * Structured JSON Generation
   */
  async generateObject<T>(
    messages: any[],
    options?: { notebookId?: string }
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
    };

    if (options?.notebookId) {
      headers["x-session-affinity"] = options.notebookId;
    }

    const response = await fetch(this.gatewayUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: CHAT_MODEL_ID,
        messages,
        response_format: { type: "json_object" },
      }),
    });
    
    if (!response.ok) {
        throw new Error(`AI Gateway error: ${await response.text()}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error(`Failed to generate object: No content in response. ${JSON.stringify(result)}`);
    }

    try {
      return JSON.parse(content);
    } catch (e) {
      console.error("[AIService] JSON Parse Error. Content:", content);
      throw new Error(`Model returned invalid JSON: ${content.slice(0, 100)}...`);
    }
  }

  /**
   * Internal Tools implementation
   */
  private _createTools(context: { userId: string; projectId: string }): Record<string, InferaTool> {
    return {
      generateScreen: {
        name: "generateScreen",
        description: generateScreenTool.description,
        parameters: generateScreenTool.parameters,
        execute: async (args) => {
          return await generateScreenTool.execute({
            ...args,
            userId: context.userId,
            projectId: context.projectId,
          });
        },
      },
      getUserCredits: {
        name: "getUserCredits",
        description: getUserCreditsTool.description,
        parameters: getUserCreditsTool.parameters,
        execute: async (args) => {
          return await getUserCreditsTool.execute({
            userId: context.userId,
          });
        },
      },
    };
  }
}

export const aiService = new AIService();
