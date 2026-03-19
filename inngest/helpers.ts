import prisma from "../lib/prisma";

/**
 * Hydrates messages by converting image URLs to base64 data URIs.
 */
export async function hydrateImages(messages: any[]) {
  return await Promise.all(
    messages.map(async (msg) => {
      if (Array.isArray(msg.content)) {
        const newContent = await Promise.all(
          msg.content.map(async (part: any) => {
            // Handle image hydration
            if (
              part.type === "image" &&
              typeof part.image === "string" &&
              part.image.startsWith("http")
            ) {
              try {
                console.log("Hydrating image:", part.image);
                const res = await fetch(part.image);
                const arrayBuffer = await res.arrayBuffer();
                const base64 = Buffer.from(arrayBuffer).toString("base64");
                const mime =
                  part.mimeType ||
                  res.headers.get("content-type") ||
                  "image/jpeg";
                // Vercel AI SDK / Google Gemini supports data URIs as 'image' value
                return {
                  ...part,
                  image: `data:${mime};base64,${base64}`,
                  mimeType: mime,
                };
              } catch (e) {
                console.error(
                  "Failed to fetch image for hydration:",
                  part.image,
                  e,
                );
                return part;
              }
            }
            return part;
          }),
        );
        return { ...msg, content: newContent };
      }
      return msg;
    }),
  );
}

/**
 * Normalizes messages for processing.
 */
export function normalizeMessages(messages: any) {
  const msgs = (Array.isArray(messages) ? messages : []).filter(
    (m) => m.content || (m.parts && m.parts.length > 0),
  );

  return msgs.map((m) => {
    // If messages already have 'parts' (our internal format), map them to 'content' for the AI SDK
    if (m.parts && Array.isArray(m.parts) && !m.content) {
      const content = m.parts.map((p: any) => {
        if (p.type === "text") {
          return { type: "text", text: p.text };
        }
        if (p.type === "image") {
          // AI SDK expects 'image' field for image parts
          return {
            type: "image",
            image: p.url,
            mimeType: p.mediaType || "image/png",
          };
        }
        return p;
      });
      return { ...m, content };
    }
    return m;
  });
}

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
}: {
  publish: any;
  projectId: string;
  message: string;
  status: string;
  messageId: string;
  currentScreen?: string;
  screenId?: string;
  screen?: any;
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
    },
  });
}

/**
 * Common planning/conclusion publishing helper.
 */
export async function publishPlan({
  publish,
  projectId,
  markdown,
  messageId,
  plan,
}: {
  publish: any;
  projectId: string;
  markdown: string;
  messageId: string;
  plan?: any;
}) {
  await publish({
    channel: `project:${projectId}`,
    topic: "plan",
    data: {
      markdown,
      messageId,
      ...(plan && { plan }),
    },
  });
}

/**
 * Extracts variation letter from title.
 */
export function getVariation(title: string) {
  const match = title.match(/\(Variation ([ABC])\)/);
  return match ? match[1] : null;
}
