import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";

export async function GET(
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

    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
        userId: session.user.id,
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
        screens: {
          orderBy: {
            createdAt: "asc",
          },
        },
        themes: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!project) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Merge screens and themes for the frontend canvas
    const mergedProject = {
      ...project,
      screens: undefined, // Clear out the split arrays
      themes: undefined,
      artifacts: [
        ...project.themes.map(t => ({
          id: t.id,
          type: "theme",
          title: t.name,
          variables: t.variables,
          x: t.x,
          y: t.y,
          width: t.width,
          height: t.height,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
          isComplete: true,
          status: "completed"
        })),
        ...project.screens.map(s => ({
          ...s,
          isComplete: s.status === "completed"
        }))
      ]
    };

    return NextResponse.json(mergedProject);
  } catch (error) {
    console.error("[PROJECT_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
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
    const { canvasData, title } = body;

    const project = await prisma.project.update({
      where: {
        id: projectId,
        userId: session.user.id,
      },
      data: {
        canvasData,
        title,
      },
    });

    return NextResponse.json(project);
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return new NextResponse("Project not found", { status: 404 });
      }
    }
    console.error("[PROJECT_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
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

    const project = await prisma.project.delete({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    return NextResponse.json(project);
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return new NextResponse("Project not found", { status: 404 });
      }
    }
    console.error("[PROJECT_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
