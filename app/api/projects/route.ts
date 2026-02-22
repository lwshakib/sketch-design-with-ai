import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = parseInt(searchParams.get("skip") || "0");
    const search = searchParams.get("search") || "";

    const where: any = {
      userId: session.user.id,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        {
          screens: {
            some: { content: { contains: search, mode: "insensitive" } },
          },
        },
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      select: {
        id: true,
        title: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        screens: {
          take: 1,
          orderBy: {
            createdAt: "asc",
          },
          select: {
            id: true,
            type: true,
            content: true,
          },
        },
      },
      take: limit,
      skip: skip,
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Transform to include firstScreenType for easier consumption
    const transformedProjects = projects.map((p) => ({
      ...p,
      firstScreenType: p.screens?.[0]?.type || null,
      firstScreenContent: p.screens?.[0]?.content || null,
      screens: undefined,
    }));

    return NextResponse.json(transformedProjects);
  } catch (error) {
    console.error("[PROJECTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { title } = body;

    if (!title) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const project = await prisma.project.create({
      data: {
        title,
        userId: session.user.id,
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("[PROJECTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
