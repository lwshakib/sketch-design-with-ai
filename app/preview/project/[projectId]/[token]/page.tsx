import prisma from "@/lib/prisma";
import { type Artifact } from "@/lib/artifact-renderer";
import { ProjectShareView } from "@/components/project/project-share-view";
import { notFound } from "next/navigation";

export default async function ProjectPreviewPage({
  params
}: {
  params: Promise<{ projectId: string, token: string }>
}) {
  const { projectId, token } = await params;

  if (!token || !projectId) {
    return notFound();
  }

  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
      shareToken: token
    },
    include: {
      screens: {
        orderBy: {
          x: 'asc'
        }
      }
    }
  });

  if (!project) {
    return notFound();
  }

  // Map database screens to Artifact type
  const artifacts: Artifact[] = project.screens.map(screen => ({
    id: screen.id,
    title: screen.title,
    content: screen.content,
    type: screen.type as any,
    x: screen.x,
    y: screen.y,
    width: screen.width || undefined,
    height: screen.height || undefined,
    status: screen.status as any,
    isComplete: true
  }));

  // Extract applied theme from canvas data if it exists
  const canvasData = project.canvasData as any;
  const appliedTheme = canvasData?.appliedTheme || null;

  return (
    <ProjectShareView 
      project={{
        title: project.title,
        shareToken: project.shareToken || "",
        themes: project.themes as any,
        appliedTheme
      }}
      artifacts={artifacts}
    />
  );
}
