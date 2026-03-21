import prisma from "../lib/prisma";

/**
 * Common status publishing helper.
 */
export async function publishStatus({
  publish,
  projectId,
  message,
  status,
  messageId,
  currentScreen,
  screenId,
  screen,
  type,
}: {
  publish: any;
  projectId: string;
  message: string;
  status: string;
  messageId?: string;
  currentScreen?: string;
  screenId?: string;
  screen?: any;
  type?: string;
}) {
  await publish({
    channel: `project:${projectId}`,
    topic: "status",
    data: {
      message,
      status,
      messageId,
      ...(currentScreen && { currentScreen }),
      ...(screenId && { screenId }),
      ...(screen && { screen }),
      ...(type && { type }),
    },
  });
}
