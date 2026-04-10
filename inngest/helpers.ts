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

/**
 * Sanitize and minify HTML context to reduce token usage.
 * - Extracts CSS variables from :root
 * - Strips <head> except for critical styles
 * - Minifies the body content
 */
export function sanitizeHtmlForContext(html: string): string {
  if (!html) return "";

  // 1. Extract CSS variables for color/style continuity
  const rootVarsMatch = html.match(/:root\s*{([^}]+)}/i);
  const rootVars = rootVarsMatch ? rootVarsMatch[0] : "";

  // 2. Extract body content
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let bodyContent = bodyMatch ? bodyMatch[1] : html;

  // 3. Strip unnecessary tags (scripts, excessive comments)
  bodyContent = bodyContent
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  // 4. Minify whitespace
  bodyContent = bodyContent.replace(/\s+/g, " ").trim();

  return `
<style>${rootVars}</style>
<body>${bodyContent}</body>
`.trim();
}
