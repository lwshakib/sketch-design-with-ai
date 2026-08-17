import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { transcribeAudio } from "@/llm";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

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

      // Validate MIME type / file format
      if (
        file.type &&
        !file.type.startsWith("audio/") &&
        !file.name?.match(/\.(mp3|wav|webm|m4a|ogg|aac|flac|mp4)$/i)
      ) {
        return NextResponse.json(
          { error: "Invalid file type. Only audio files are allowed." },
          { status: 400 },
        );
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "Payload Too Large: Audio file size exceeds 25MB limit" },
          { status: 413 },
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }

    // Validate buffer size
    if (buffer.length === 0) {
      return NextResponse.json(
        { error: "Audio file cannot be empty" },
        { status: 400 },
      );
    }

    if (buffer.length > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Payload Too Large: Audio file size exceeds 25MB limit" },
        { status: 413 },
      );
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
