import { Type } from "@google/genai";
import { inngest } from "@/inngest/client";

export const generateThemeTool = {
  name: "generateTheme",
  description: "Generate a foundational Style Guide (Theme) screen for the project. MUST be called first before any other screen is generated.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: "Must be 'Theme' or 'Style Guide'.",
      },
      prompt: {
        type: Type.STRING,
        description: "Instructions for base variables, colors, and typography scales based on the user's initial creative direction.",
      },
      pendingScreenTitle: {
        type: Type.STRING,
        description: "The title of the first functional screen to generate after the theme is established.",
      },
      pendingScreenPrompt: {
        type: Type.STRING,
        description: "The design instructions for the first functional screen.",
      },
      pendingScreenType: {
        type: Type.STRING,
        enum: ["app", "web"],
        description: "The platform type for the pending screen.",
      },
    },
    required: ["title", "prompt"],
  },
  execute: async (args: any, context: { userId: string; projectId: string }) => {
    try {
      console.log(`[Tool: generateTheme] Initiating Theme Protocol`);
      await inngest.send({
        name: "app/theme.generate",
        data: {
          projectId: context.projectId,
          title: args.title || "Style Guide",
          prompt: args.prompt,
          userId: context.userId,
          pendingScreen: args.pendingScreenTitle ? {
             title: args.pendingScreenTitle,
             prompt: args.pendingScreenPrompt,
             type: args.pendingScreenType
          } : undefined
        },
      });

      return {
        status: "success",
        message: `Theme protocol initiated. The Style Guide is now being generated in the background. Note: Tell the user you are establishing the design system first.`,
      };
    } catch (error: any) {
      console.error("[Tool: generateTheme] Error:", error);
      return {
        status: "error",
        message: `Failed to initiate theme design: ${error.message}`,
      };
    }
  },
};
