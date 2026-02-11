import prisma from "@/lib/prisma";
import { type Artifact } from "@/lib/artifact-renderer";
import { ScreenShareView } from "@/components/project/screen-share-view";
import { notFound } from "next/navigation";

export default async function SingleScreenPreviewPage({
  params
}: {
  params: Promise<{ screenId: string, token: string }>
}) {
  const { screenId, token } = await params;

  if (!token || !screenId) {
    return notFound();
  }

  const project = await prisma.project.findUnique({
    where: {
      shareToken: token
    },
    include: {
      screens: {
        where: {
          id: screenId
        }
      }
    }
  });

  if (!project || project.screens.length === 0) {
    return notFound();
  }

  const screen = project.screens[0];

  // Map database screen to Artifact type
  const artifact: Artifact = {
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
  };

  // Extract applied theme from canvas data if it exists
  const canvasData = project.canvasData as any;
  const appliedTheme = canvasData?.appliedTheme || null;

  return (
    <ScreenShareView 
      project={{
        title: project.title,
        shareToken: project.shareToken || "",
        themes: project.themes as any,
        appliedTheme
      }}
      artifact={artifact}
    />
  );
}
