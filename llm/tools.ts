import { tool } from "ai";
import { z } from "zod";

/**
 * Tool for extracting HTML content from a given URL.
 * Used by the AI to understand the structure and content of reference websites.
 */
export const extractHtml = tool({
  description:
    "Extract HTML content and text from a URL to understand its structure and design.",
  parameters: z.object({
    url: z.string().describe("The URL of the website to extract content from."),
  }),
  // @ts-ignore
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
});
