import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { UX_AGENT_SYSTEM_PROMPT } from "@/lib/prompts";
import { aiService } from "@/services/ai.services";
import { getAndResetCredits } from "@/lib/credits";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages, projectId, imagePaths = [] } = await req.json();

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
              text:
                typeof lastUserMessage.content === "string"
                  ? lastUserMessage.content
                  : lastUserMessage.content?.[0]?.text || "",
            },
            ...(imagePaths?.map((path: string) => ({
              type: "image",
              path: path,
              mediaType: "image/png",
            })) || []),
          ],
          status: "completed",
        },
      });
    }

    // 2. Construct Project Context
    const currentCredits = await getAndResetCredits(session.user.id);
    const existingScreensSummary = project.screens.length > 0 
      ? `\n\nExisting Screens in Project: ${project.screens.map(s => `"${s.title}"`).join(", ")}.`
      : "";

    const creditContext = `\n\nUser Credits: ${currentCredits} remaining today. Each generated screen costs 1 credit. If credits are low, plan your generations carefully. If credits are exhausted, inform the user you cannot generate more screens until tomorrow.`;

    const projectContextPrompt = `${UX_AGENT_SYSTEM_PROMPT}${existingScreensSummary}${creditContext}\n\nStrictly follow the role of Sketch. Your userId is ${session.user.id}.`;

    const normalizedMessages = (messages || []).map((msg: any, idx: number) => {
      const isLastMessage = idx === (messages?.length || 0) - 1;
      const role = msg.role === "data" ? "tool" : msg.role;
      
      // Basic text content extraction
      const textContent = typeof msg.content === "string" 
        ? msg.content 
        : msg.parts?.find((p: any) => p.type === "text")?.text || msg.content?.[0]?.text || "";

      // Handle Vision for User Messages
      if (role === "user") {
        const content: any[] = [{ type: "text", text: textContent }];
        
        // If this is the last message and we have imagePaths, attach them
        if (isLastMessage && imagePaths.length > 0) {
          imagePaths.slice(0, 2).forEach((path: string) => {
            content.push({ type: "image_url", image_url: { url: path } });
          });
        }
        
        return { role, content };
      }

      return {
        role,
        content: textContent,
        ...(msg.role === "assistant" && msg.tool_calls ? { tool_calls: msg.tool_calls } : {}),
        ...(msg.role === "tool" ? { tool_call_id: msg.tool_call_id, name: msg.name } : {}),
      };
    });

    // 3. Start streaming from AIService
    const processedMessages = await aiService.processMessages([
      { role: "system", content: projectContextPrompt },
      ...normalizedMessages,
    ]);

    const serviceStream = await aiService.streamText(processedMessages, {
      context: {
        userId: session.user.id,
        projectId: projectId,
      },
      onFinish: async ({ content, reasoning }) => {
        if (content.trim() || reasoning?.trim()) {
          const parts = [];
          if (reasoning?.trim()) {
            parts.push({ type: "reasoning", text: reasoning });
          }
          if (content.trim()) {
            parts.push({ type: "text", text: content });
          }

          await prisma.message.create({
            data: {
              projectId,
              role: "assistant",
              parts,
              status: "completed",
            },
          });
        }
      },
    });

    if (!serviceStream) throw new Error("Failed to initialize AI stream");

    const encoder = new TextEncoder();
    const reader = (serviceStream as ReadableStream).getReader();

    const stream = new ReadableStream({
      async start(controller) {
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
              if (trimmed.startsWith("data: ")) {
                try {
                  const event = JSON.parse(trimmed.slice(6));

                  if (event.type === "text") {
                    controller.enqueue(
                      encoder.encode(`0:${JSON.stringify(event.content)}\n`),
                    );
                  } else if (event.type === "reasoning") {
                    // Stream reasoning with prefix 8:
                    controller.enqueue(
                      encoder.encode(`8:${JSON.stringify(event.content)}\n`),
                    );
                  } else if (event.type === "tool_result") {
                    // Map tool results back to useChat data part (2:)
                    const toolResult = event.result;
                    controller.enqueue(encoder.encode(`2:[${JSON.stringify({ 
                        type: "tool-result", 
                        tool: event.name, 
                        ...toolResult 
                    })}]\n`));
                    
                    // Specific toast message for generateScreen successfully called
                    if (event.name === "generateScreen" && toolResult.status === "success") {
                         controller.enqueue(encoder.encode(`0:${JSON.stringify("\n\n✨ Design protocol initiated. I'm building " + (event.args?.title || "your screen") + " now.")}\n`));
                    }
                  } else if (event.type === "error") {
                    controller.enqueue(encoder.encode(`3:${JSON.stringify(event.message)}\n`));
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        } catch (error) {
          console.error("[ChatAPI] Bridge Loop Error:", error);
          controller.enqueue(encoder.encode(`3:${JSON.stringify("Connection lost. Please try again.")}\n`));
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
