import { s3Service } from "@/services/s3.services";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
    const { contentType, folder = "attachments", fileName } = await req.json();

    if (!contentType) {
      return NextResponse.json(
        { error: "Content type is required" },
        { status: 400 },
      );
    }

    const extension = fileName?.split(".").pop() || contentType.split("/")[1];
    const path = `${folder}/${uuidv4()}.${extension}`;

    const presignedUrl = await s3Service.getPresignedUploadUrl(path, contentType);

    return NextResponse.json({
      uploadUrl: presignedUrl,
      path: path,
    });
  } catch (error: any) {
    console.error("[API] Storage Presigned URL Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
