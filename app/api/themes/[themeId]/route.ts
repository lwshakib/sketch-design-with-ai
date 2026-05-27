import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ themeId: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { themeId } = await params;

    const theme = await prisma.theme.delete({
      where: {
        id: themeId,
        project: {
          userId: session.user.id,
        },
      },
    });

    return NextResponse.json(theme);
  } catch (error) {
    console.error("[THEME_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
