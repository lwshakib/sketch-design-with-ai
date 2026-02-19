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

    const newProject = await prisma.$transaction(async (tx) => {
      // 1. Create the new project
      const project = await tx.project.create({
        data: {
          title: `${originalProject.title} (Copy)`,
          userId: session.user.id,
          canvasData: originalProject.canvasData || {},
        }
      });

      // 2. Create new messages and build an ID map
      const oldToNewMessageId = new Map<string, string>();
      
      for (const msg of originalProject.messages) {
        const newMsg = await tx.message.create({
          data: {
            projectId: project.id,
            role: msg.role,
            parts: msg.parts || [],
            status: msg.status,
            plan: msg.plan || {},
          }
        });
        oldToNewMessageId.set(msg.id, newMsg.id);
      }

      // 3. Create screens with remapped generationMessageId
      // We also need to remap ids in the canvasData if strictly necessary, but sticking to the request about 'preview screen message'
      await tx.screen.createMany({
        data: originalProject.screens.map(s => ({
          projectId: project.id,
          title: s.title,
          content: s.content,
          type: s.type,
          x: s.x,
          y: s.y,
          width: s.width,
          height: s.height,
          status: s.status,
          isLiked: s.isLiked,
          isDisliked: s.isDisliked,
          generationMessageId: s.generationMessageId ? oldToNewMessageId.get(s.generationMessageId) || null : null
        }))
      });

      return project;
    });

    return NextResponse.json(newProject);
  } catch (error) {
    console.error("[PROJECT_DUPLICATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
