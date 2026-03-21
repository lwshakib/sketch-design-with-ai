import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { inngest } from "@/inngest/client";
import { streamText as streamGLMText } from "@/llm/stream-text";
import { UX_AGENT_SYSTEM_PROMPT } from "@/llm/prompts";
import { generateScreen, getUserCredits } from "@/llm/tools";
import { consumeCredit, getAndResetCredits } from "@/lib/credits";

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

    // 1. Fetch Project State & Persist User Message
    const project = await prisma.project.findUnique({
       where: { id: projectId },
       include: { screens: true }
    });

    if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const lastUserMessage = messages?.[messages.length - 1];
    if (lastUserMessage && lastUserMessage.role === "user") {
      await prisma.message.create({
        data: {
          projectId,
          role: "user",
          parts: lastUserMessage.parts || [
            { 
               type: "text", 
               text: typeof lastUserMessage.content === "string" 
                 ? lastUserMessage.content 
                 : lastUserMessage.content?.[0]?.text || "" 
            }
          ],
          status: "completed",
        },
      });
    }

    // 2. Fetch Full History for Context
    const dbMessages = await prisma.message.findMany({
       where: { projectId },
       orderBy: { createdAt: "asc" },
       take: 50
    });

    const normalizedHistory = dbMessages.map((msg) => ({
      role: msg.role,
      content: (msg.parts as any)?.find((p: any) => p.type === "text")?.text || ""
    }));

    // 3. Construct Project Context (Visible Screens) & Credits
    const currentCredits = await getAndResetCredits(session.user.id);
    const existingScreensSummary = project.screens.length > 0 
      ? `\n\nExisting Screens in Project: ${project.screens.map(s => `"${s.title}"`).join(", ")}.`
      : "";

    const creditContext = `\n\nUser Credits: ${currentCredits} remaining today. Each generated screen costs 1 credit. If credits are low, plan your generations carefully. If credits are exhausted, inform the user you cannot generate more screens until tomorrow.`;

    const projectContextPrompt = `${UX_AGENT_SYSTEM_PROMPT}${existingScreensSummary}${creditContext}\n\nStrictly follow the role of Sketch. Your userId is ${session.user.id}.`;

    // 2. Normalize messages for GLM
    const normalizedMessages = (messages || []).map((msg: any) => ({
      role: msg.role,
      content:
        typeof msg.content === "string"
          ? msg.content
          : msg.parts?.find((p: any) => p.type === "text")?.text || msg.content?.[0]?.text || "",
    }));

    // 4. Start streaming from GLM
    const workerStream = await streamGLMText({
      messages: [
        { role: "system", content: projectContextPrompt },
        ...normalizedHistory,
      ],
      tools: { generateScreen, getUserCredits },
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
                  "[ChatAPI] Triggering background generation for:",
                  args.title,
                );

                // Start Design via Tool Execution
                await generateScreen.execute({
                  ...args,
                  projectId,
                  userId: session.user.id,
                });

                // Send data part to notify the UI
                controller.enqueue(
                  encoder.encode(
                    `2:[${JSON.stringify({
                      type: "tool-result",
                      tool: "generateScreen",
                      title: args.title,
                    })}]\n`,
                  ),
                );
              } catch (err: any) {
                console.error(
                  "[ChatAPI] Failed to trigger generateScreen tool:",
                  err,
                );
                
                if (err.message === "CREDITS_EXHAUSTED") {
                    controller.enqueue(
                      encoder.encode(
                        `0:${JSON.stringify("\n\n⚠️ Credits Exhausted. Your daily limit of 10 screens has been reached. Please come back in 24 hours for a refresh.")}\n`,
                      ),
                    );
                    break; // Stop further tool executions
                }
              }
            } else if (tc.name === "getUserCredits") {
                 // The AI can call this to verify balance or confirm constraints
                 const result = await getUserCredits.execute({ userId: session.user.id });
                 controller.enqueue(
                    encoder.encode(`2:[${JSON.stringify({ type: 'tool-result', tool: 'getUserCredits', ...result })}]\n`)
                 );
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
