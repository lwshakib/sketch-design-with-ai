import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { inngest } from "@/inngest/client";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      messages,
      projectId,
      is3xMode,
      imageUrls,
      isSilent,
      selectedScreens,
      screenId,
      instructions,
      isVariations,
      originalScreenId,
      optionsCount,
      variationCreativeRange,
      variationCustomInstructions,
      variationAspects,
    } = await req.json();

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 },
      );
    }

    // Get the last message (user's current message)
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== "user") {
      return NextResponse.json(
        { error: "Last message must be from user" },
        { status: 400 },
      );
    }

    // 1. Create User Message
    const _userMsg = await prisma.message.create({
      data: {
        projectId: projectId,
        role: "user",
        parts: lastMessage.parts || [
          {
            type: "text",
            text:
              typeof lastMessage.content === "string"
                ? lastMessage.content
                : lastMessage.parts?.find((p: any) => p.type === "text")
                    ?.text || "",
          },
        ],
        plan: selectedScreens ? { selectedScreens } : undefined,
      },
    });

    // 2. Create Assistant Message Placeholder (if not silent)
    let assistantMessageId = null;
    if (!isSilent) {
      const _introText = screenId
        ? "*Architecting refactored layout...*"
        : isVariations
          ? `*Architecting variations...*`
          : "*Analyzing your request and architecting project manifest...*";

      const assistantMsg = await prisma.message.create({
        data: {
          projectId: projectId,
          role: "assistant",
          parts: [],
          status: "generating",
        },
      });
      assistantMessageId = assistantMsg.id;
    }

    // Normalize messages for Inngest
    const normalizedMessages = (messages || [])
      .map((msg: any) => {
        // Handle simple string content
        if (typeof msg.content === "string" && !msg.parts) {
          return { role: msg.role, content: msg.content };
        }

        // Handle multipart content
        if (msg.parts && Array.isArray(msg.parts)) {
          const content = msg.parts
            .map((p: any) => {
              if (p.type === "text") return { type: "text", text: p.text };
              if (p.type === "image" || p.type === "file")
                return { type: "image", image: p.url };
              return null;
            })
            .filter(Boolean);

          return { role: msg.role, content };
        }

        // Fallback
        return { role: msg.role, content: msg.content || "" };
      })
      .filter((msg: any) => {
        if (Array.isArray(msg.content)) return msg.content.length > 0;
        return !!msg.content;
      });

    // Trigger Inngest function
    await inngest.send({
      name: "app/design.generate",
      data: {
        messages: normalizedMessages,
        projectId,
        is3xMode,
        imageUrls: imageUrls || [],
        isSilent,
        screenId,
        instructions,
        assistantMessageId, // Pass the ID we just created
        isVariations,
        originalScreenId,
        optionsCount,
        variationCreativeRange,
        variationCustomInstructions,
        variationAspects,
      },
    });

    return NextResponse.json({ success: true, assistantMessageId });
  } catch (error) {
    console.error("[CHAT]", error);
    return NextResponse.json(
      { error: "Failed to start design generation" },
      { status: 500 },
    );
  }
}
