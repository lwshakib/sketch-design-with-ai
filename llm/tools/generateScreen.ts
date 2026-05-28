import { Type } from "@google/genai";
import { generateScreenSync } from "@/lib/generation";

export const generateScreenTool = {
  name: "generateScreen",
  description: "Generate a new design screen based on architectural and visual descriptions. Call this once for each new screen you want to create.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: "A concise title for the screen (e.g. 'Hero Section', 'Project Dashboard').",
      },
      prompt: {
        type: Type.STRING,
        description: "Comprehensive instructions for the screen layout (left/right/top/bottom), components, and style.",
      },
      type: {
        type: Type.STRING,
        enum: ["app", "web"],
        description: "The platform type for this screen.",
      },
    },
    required: ["title", "prompt", "type"],
  },
  execute: async (args: any, context: { userId: string; projectId: string; onProgress?: (event: any) => void }) => {
    try {
      console.log(`[Tool: generateScreen] Initiating for: ${args.title}`);
      const result = await generateScreenSync({
        projectId: context.projectId,
        title: args.title,
        prompt: args.prompt,
        type: args.type,
        userId: context.userId,
        onProgress: context.onProgress,
      });

      return {
        status: "success",
        message: `Design protocol initiated for "${args.title}" (${args.type}). Generation complete.`,
        screen: result.screen,
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
