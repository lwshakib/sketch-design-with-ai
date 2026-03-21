import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { inngest } from "@/inngest/client";
import { streamText as streamGLMText } from "@/llm/stream-text";
import { UX_AGENT_SYSTEM_PROMPT } from "@/llm/prompts";
import { generateScreen } from "@/llm/tools";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages, projectId, is3xMode, imageUrls } = await req.json();

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 },
      );
    }

    // 1. Normalize messages for GLM
    const normalizedMessages = (messages || []).map((msg: any) => ({
      role: msg.role,
      content:
        typeof msg.content === "string"
          ? msg.content
          : msg.content?.[0]?.text || "",
    }));

    // 2. Start streaming from GLM
    const workerStream = await streamGLMText({
      messages: [
        { role: "system", content: UX_AGENT_SYSTEM_PROMPT },
        ...normalizedMessages,
      ],
      tools: { generateScreen },
      temperature: 0.7,
    });

    if (!workerStream) throw new Error("Failed to initialize GLM stream");

    const encoder = new TextEncoder();
    const reader = workerStream.getReader();

    const stream = new ReadableStream({
      async start(controller) {
        const decoder = new TextDecoder();
        let buffer = "";
        let fullContent = "";
        let toolCallsBuffer: Record<string, any> = {};

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ") && line !== "data: [DONE]") {
                try {
                  const data = JSON.parse(line.slice(6));
                  const delta = data.choices[0].delta;

                  // Handle Text
                  if (delta.content) {
                    fullContent += delta.content;
                    // Format for useChat (text part prefix is 0:)
                    controller.enqueue(
                      encoder.encode(`0:${JSON.stringify(delta.content)}\n`),
                    );
                  }

                  // Handle Tool Calls (Accumulate for final execution)
                  if (delta.tool_calls) {
                    for (const tc of delta.tool_calls) {
                      const index = tc.index;
                      if (!toolCallsBuffer[index]) {
                        toolCallsBuffer[index] = {
                          id: tc.id,
                          name: tc.function?.name || "",
                          args: tc.function?.arguments || "",
                        };
                      } else {
                        if (tc.function?.arguments) {
                          toolCallsBuffer[index].args += tc.function.arguments;
                        }
                      }
                    }
                  }
                } catch (e) {
                  // Skip invalid JSON lines
                }
              }
            }
          }

          // 3. Process Accumulated Tool Calls
          const toolCallArray = Object.values(toolCallsBuffer);
          for (const tc of toolCallArray) {
            if (tc.name === "generateScreen") {
              try {
                const args = JSON.parse(tc.args);
                console.log(
                  "[ChatAPI] Directly generating screen:",
                  args.title,
                );

                // Trigger Screen Generation
                await inngest.send({
                  name: "app/screen.generate",
                  data: {
                    projectId: args.projectId,
                    title: args.title,
                    prompt: args.prompt,
                    type: args.type,
                  },
                });

                // Send data part
                controller.enqueue(
                  encoder.encode(
                    `2:[${JSON.stringify({
                      type: "tool-result",
                      tool: "generateScreen",
                      title: args.title,
                    })}]\n`,
                  ),
                );
              } catch (err) {
                console.error(
                  "[ChatAPI] Failed to trigger generateScreen tool:",
                  err,
                );
              }
            }
          }

          // 4. Persistence (Save the final assistant message if not just tool calls)
          if (fullContent.trim()) {
            await prisma.message.create({
              data: {
                projectId,
                role: "assistant",
                parts: [{ type: "text", text: fullContent }],
                status: "completed",
              },
            });
          }
        } catch (error) {
          console.error("[ChatAPI] Read Loop Error:", error);
          controller.enqueue(
            encoder.encode(
              `3:${JSON.stringify("Connection lost. Please try again.")}\n`,
            ),
          );
        } finally {
          controller.close();
          reader.releaseLock();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("[CHAT]", error);
    return NextResponse.json(
      { error: "Failed to initialize communication" },
      { status: 500 },
    );
  }
}
