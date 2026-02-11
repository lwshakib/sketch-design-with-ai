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

    const { messages, projectId, screenId, instructions } = await req.json();

    if (!projectId || !screenId) {
      return NextResponse.json(
        { error: "projectId and screenId are required" },
        { status: 400 }
      );
    }

    // Trigger Inngest function for specific screen regeneration
    await inngest.send({
      name: "app/screen.regenerate",
      data: {
        messages,
        projectId,
        screenId,
        instructions
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[REGENERATE]", error);
    return NextResponse.json({ error: "Failed to start regeneration" }, { status: 500 });
  }
}
