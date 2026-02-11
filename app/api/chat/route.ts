import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { inngest } from "@/inngest/client";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages, projectId, is3xMode, websiteUrl } = await req.json();

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

    // Save user message - extract text from either content or parts
    const messageContent = typeof lastMessage.content === 'string' 
      ? lastMessage.content 
      : lastMessage.parts?.find((p: any) => p.type === 'text')?.text || "";
    
    await prisma.message.create({
      data: {
        projectId: projectId,
        role: "user",
        content: messageContent
      },
    });

    // Normalize messages for Inngest - convertToModelMessages expects { role, content } format
    const normalizedMessages = (messages || []).map((msg: any) => {
      const content = typeof msg.content === 'string' 
        ? msg.content 
        : msg.parts?.find((p: any) => p.type === 'text')?.text || "";
      return {
        role: msg.role,
        content
      };
    }).filter((msg: any) => msg.content); // Remove empty messages

    // Trigger Inngest function
    await inngest.send({
      name: "app/design.generate",
      data: {
        messages: normalizedMessages,
        projectId,
        is3xMode,
        websiteUrl
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CHAT]", error);
    return NextResponse.json({ error: "Failed to start design generation" }, { status: 500 });
  }
}
