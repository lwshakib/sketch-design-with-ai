"use server";

import { inngest } from "@/inngest/client";
import { getSubscriptionToken } from "@inngest/realtime";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function fetchInngestToken(projectId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  // Generate a token scoped to this specific project's channel
  const token = await getSubscriptionToken(inngest, {
    channel: `project:${projectId}`,
    topics: ["plan", "status"],
  });

  return token;
}
