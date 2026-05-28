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

export async function PATCH(
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
    const body = await req.json();
    const { isActive, x, y, width, height, name, variables } = body;

    const existingTheme = await prisma.theme.findFirst({
      where: {
        id: themeId,
        project: {
          userId: session.user.id,
        },
      },
    });

    if (!existingTheme) {
      return new NextResponse("Not Found", { status: 404 });
    }

    if (isActive === true) {
      await prisma.theme.updateMany({
        where: {
          projectId: existingTheme.projectId,
          id: { not: themeId },
        },
        data: {
          isActive: false,
        },
      });
    }

    const theme = await prisma.theme.update({
      where: {
        id: themeId,
      },
      data: {
        isActive: isActive !== undefined ? isActive : undefined,
        x: x !== undefined ? x : undefined,
        y: y !== undefined ? y : undefined,
        width: width !== undefined ? width : undefined,
        height: height !== undefined ? height : undefined,
        name: name !== undefined ? name : undefined,
        variables: variables !== undefined ? variables : undefined,
      },
    });

    return NextResponse.json(theme);
  } catch (error) {
    console.error("[THEME_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
