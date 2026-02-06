import { auth } from "@/lib/auth";
import { streamText } from "@/llm/streamText";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { extractArtifacts, stripArtifact } from "@/lib/artifact-renderer";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages, projectId } = await req.json();

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    // Get the last message (user's current message)
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== "user") {
      return NextResponse.json(
        { error: "Last message must be from user" },
        { status: 400 }
      );
    }

    // Save user message
    await prisma.message.create({
      data: {
        projectId: projectId,
        role: "user",
        parts: lastMessage.parts
      },
    });

    // Save assistant message after streaming completes
    const onFinish: any = async (result: any) => {
      try {
        const fullText = result.text;
        const artifacts = extractArtifacts(fullText);
        const strippedText = stripArtifact(fullText);

        await prisma.message.create({
          data: {
            projectId: projectId,
            role: "assistant",
            parts: [{ type: 'text', text: strippedText }],
          },
        });

        if (artifacts.length > 0) {
          const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { canvasData: true }
          });
          
          const currentCanvasData = (project?.canvasData as any) || {};
          const currentArtifacts = currentCanvasData.artifacts || [];
          
          // Merge logic: Update existing by title, or append new
          const updatedArtifacts = [...currentArtifacts];
          
          artifacts.forEach(newArt => {
            const existingIndex = updatedArtifacts.findIndex(a => a.title === newArt.title);
            if (existingIndex >= 0) {
              updatedArtifacts[existingIndex] = {
                ...updatedArtifacts[existingIndex],
                content: newArt.content,
                isComplete: newArt.isComplete
              };
            } else {
              // Add new artifact with a default offset to prevent overlapping
              const lastArt = updatedArtifacts[updatedArtifacts.length - 1];
              const getWidth = (t: string) => t === 'app' ? 380 : t === 'web' ? 1024 : 800;
              const currentWidth = getWidth(newArt.type);
              
              // Center the first artifact, or place the next one to the right
              const newX = lastArt 
                ? (lastArt.x || 0) + (lastArt.width || getWidth(lastArt.type)) + 120 
                : -(currentWidth / 2);

              updatedArtifacts.push({
                ...newArt,
                x: newX,
                y: 0
              });
            }
          });
          
          await prisma.project.update({
            where: { id: projectId },
            data: {
              canvasData: {
                ...currentCanvasData,
                artifacts: updatedArtifacts,
              }
            }
          });
        }
      } catch (error) {
        console.error("[CHAT] Failed to save assistant message or artifacts:", error);
      }
    };

    const result = await streamText(messages, {
      onFinish,
    });

    // Create a custom response using the Vercel AI SDK method
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("[CHAT]", error);
    return NextResponse.json({ error: "Failed to chat" }, { status: 500 });
  }
}
