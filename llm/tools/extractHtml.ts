import { Type } from "@google/genai";

export const extractHtmlTool = {
  name: "extractHtml",
  description:
    "Extract HTML content and text from a URL to understand its structure and design.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      url: {
        type: Type.STRING,
        description: "The URL of the website to extract content from.",
      },
    },
    required: ["url"],
  },
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
