import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { projectId } = await params;

    // Verify ownership
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
        userId: session.user.id
      }
    });

    if (!project) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const shareToken = nanoid(24);

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: { shareToken }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[SHARE_RESET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
