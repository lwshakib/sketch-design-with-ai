import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

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

    const originalProject = await prisma.project.findUnique({
      where: {
        id: projectId,
        userId: session.user.id,
      },
      include: {
        messages: true,
        screens: true,
      }
    });

    if (!originalProject) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const newProject = await prisma.project.create({
      data: {
        title: `${originalProject.title} (Copy)`,
        userId: session.user.id,
        canvasData: originalProject.canvasData || {},
        messages: {
          create: originalProject.messages.map(m => ({
            role: m.role,
            content: m.content || "",
            status: m.status,
            plan: m.plan || {},
          }))
        },
        screens: {
          create: originalProject.screens.map(s => ({
            title: s.title,
            content: s.content,
            type: s.type,
            x: s.x,
            y: s.y,
            width: s.width,
            height: s.height,
            status: s.status,
          }))
        }
      }
    });

    return NextResponse.json(newProject);
  } catch (error) {
    console.error("[PROJECT_DUPLICATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
