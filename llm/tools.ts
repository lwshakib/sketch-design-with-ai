import { z } from "zod";

/**
 * Tool for extracting HTML content from a given URL.
 * Plain object implementation (no AI SDK dependency).
 */
export const extractHtml = {
  description:
    "Extract HTML content and text from a URL to understand its structure and design.",
  parameters: z.object({
    url: z.string().describe("The URL of the website to extract content from."),
  }),
  execute: async ({ url }: { url: string }) => {
    try {
      console.log(`[Tool] Extracting HTML from: ${url}`);
      const response = await fetch(url);
      if (!response.ok) {
        return { error: `Failed to fetch: ${response.statusText}` };
      }

      const html = await response.text();

      // Basic cleaning to avoid token bloat
      const titleMatch = html.match(/<title>(.*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1] : "No Title";

      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      let body = bodyMatch ? bodyMatch[1] : html;

      // Remove scripts and styles
      body = body
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .substring(0, 5000); // 5000 characters for better context

      return {
        url,
        title,
        content: body,
      };
    } catch (error: any) {
      console.error(`[Tool] Error extracting HTML:`, error);
      return { error: error.message };
    }
  },
};
/**
 * Tool for triggering the design ingestion process for a new screen.
 */
export const generateScreen = {
  description:
    "Generate a new design screen based on architectural and visual descriptions. Call this once for each new screen you want to create.",
  parameters: z.object({
    screenTitle: z
      .string()
      .describe("A concise title for the screen (e.g. 'Hero Section', 'Project Dashboard')."),
    screenContent: z
      .string()
      .describe("Detailed instructions for the screen layout, components, and style."),
  }),
  execute: async (args: { screenTitle: string; screenContent: string }) => {
    // This tool is primarily intercepted by the chat route or handled via side-effects.
    return { 
      success: true, 
      message: `Design protocol initiated for "${args.screenTitle}". Generation is now running in the background.`,
      ...args 
    };
  },
};
