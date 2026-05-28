import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { projectId } = await params;
    const body = await req.json();
    const { name, colors, typography } = body;

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Deactivate existing themes
    await prisma.theme.updateMany({
      where: { projectId },
      data: { isActive: false },
    });

    const themesCount = await prisma.theme.count({
      where: { projectId },
    });

    const currentX = -1280 / 2; // Centered
    const currentY = 600 + themesCount * 900; // Next row

    const variables = {
      colors: colors || {
        primary: "#6366f1",
        secondary: "#ec4899",
        tertiary: "#14b8a6",
        neutral: "#94a3b8",
        background: "#080808",
        foreground: "#ffffff",
      },
      typography: typography || {
        headline: "Inter",
        body: "Inter",
        label: "Inter",
      },
      brandName: name || "Design System",
    };

    const theme = await prisma.theme.create({
      data: {
        projectId,
        name: name || "Custom Theme",
        variables,
        x: currentX,
        y: currentY,
        isActive: true,
      },
    });

    return NextResponse.json({
      id: theme.id,
      type: "theme",
      title: theme.name,
      variables: theme.variables,
      x: theme.x,
      y: theme.y,
      width: theme.width,
      height: theme.height,
      isActive: theme.isActive,
      isComplete: true,
      status: "completed",
    });
  } catch (error) {
    console.error("[THEME_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
