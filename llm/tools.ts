import { inngest } from "@/inngest/client";
import { getAndResetCredits } from "@/lib/credits";

/**
 * Tool for extracting HTML content from a given URL.
 * Plain object implementation (no AI SDK dependency).
 */
export const extractHtml = {
  description:
    "Extract HTML content and text from a URL to understand its structure and design.",
  parameters: {
    type: "object",
    properties: {
      url: {
        type: "string",
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
/**
 * Tool for triggering the design ingestion process for a new screen.
 */
export const generateScreen = {
  description:
    "Generate a new design screen based on architectural and visual descriptions. Call this once for each new screen you want to create.",
  parameters: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "The unique ID of the current project.",
      },
      title: {
        type: "string",
        description: "A concise title for the screen (e.g. 'Hero Section', 'Project Dashboard').",
      },
      prompt: {
        type: "string",
        description: "Comprehensive instructions for the screen layout (left/right/top/bottom), components, and style.",
      },
      type: {
        type: "string",
        enum: ["app", "web"],
        description: "The platform type for this screen.",
      },
    },
    required: ["projectId", "title", "prompt", "type"],
  },
  execute: async (args: {
    projectId: string;
    title: string;
    prompt: string;
    type: string;
    userId?: string;
  }) => {
    try {
      console.log(`[Tool: generateScreen] Initiating for: ${args.title}`);
      await inngest.send({
        name: "app/screen.generate",
        data: {
          projectId: args.projectId,
          title: args.title,
          prompt: args.prompt,
          type: args.type,
          userId: args.userId,
        },
      });

      return {
        status: "success",
        message: `Design protocol initiated for "${args.title}" (${args.type}). Generation is now running in the background.`,
      };
    } catch (error: any) {
      console.error("[Tool: generateScreen] Error:", error);
      return {
        status: "error",
        message: `Failed to initiate design: ${error.message}`,
      };
    }
  },
};

/**
 * Tool for the AI to check how many credits the user has left.
 * AI should call this to plan generations within the user's budget.
 */
export const getUserCredits = {
  description:
    "Retrieve the user's remaining design credits. Use this to plan how many screens you can realistically suggest or generate.",
  parameters: {
    type: "object",
    properties: {
      userId: {
        type: "string",
        description: "The unique ID of the user.",
      },
    },
    required: ["userId"],
  },
  execute: async ({ userId }: { userId: string }) => {
    try {
      const credits = await getAndResetCredits(userId);
      return {
        credits,
        message: `You currently have ${credits} credits left. Generating each screen consumes exactly 1 credit.`,
      };
    } catch (error: any) {
      return { error: `Failed to fetch credits: ${error.message}` };
    }
  },
};
