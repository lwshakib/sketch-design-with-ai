import { Type } from "@google/genai";
import { inngest } from "@/inngest/client";

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
  execute: async (args: any, context: { userId: string; projectId: string }) => {
    try {
      console.log(`[Tool: generateScreen] Initiating for: ${args.title}`);
      await inngest.send({
        name: "app/screen.generate",
        data: {
          projectId: context.projectId,
          title: args.title,
          prompt: args.prompt,
          type: args.type,
          userId: context.userId,
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
