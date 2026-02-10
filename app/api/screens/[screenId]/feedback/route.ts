import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ screenId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { screenId } = await params;
    const body = await req.json();
    const { action } = body; // 'like' | 'dislike' | 'none'

    let data = {};
    if (action === 'like') {
      data = { isLiked: true, isDisliked: false };
    } else if (action === 'dislike') {
      data = { isLiked: false, isDisliked: true };
    } else {
      data = { isLiked: false, isDisliked: false };
    }

    const screen = await prisma.screen.update({
      where: {
        id: screenId,
        project: {
          userId: session.user.id
        }
      },
      data
    });

    return NextResponse.json(screen);
  } catch (error) {
    console.error("[SCREEN_FEEDBACK_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
