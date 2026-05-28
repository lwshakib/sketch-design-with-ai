import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { transcribeAudio } from "@/llm";

/**
 * POST Handler - Processes an audio file (JSON base64 or FormData) and returns the transcribed text.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let buffer: Buffer;
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const { audioData } = await req.json();
      if (!audioData || typeof audioData !== "string") {
        return NextResponse.json(
          {
            error:
              "Missing or invalid audioData (base64 string) in request body.",
          },
          { status: 400 },
        );
      }
      buffer = Buffer.from(audioData, "base64");
    } else {
      const formData = await req.formData();
      const file = formData.get("file") as File;
      if (!file) {
        return NextResponse.json(
          { error: "Audio file is required" },
          { status: 400 },
        );
      }
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }

    const transcript = await transcribeAudio(buffer);

    return NextResponse.json({
      transcript,
      transcription: transcript, // Maintain compatibility with both frontend expectations
    });
  } catch (error: any) {
    console.error("[Transcribe Route Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to transcribe audio" },
      { status: 500 },
    );
  }
}
