import { Type } from "@google/genai";
import { generateThemeSync } from "@/lib/generation";

export const generateThemeTool = {
  name: "generateTheme",
  description:
    "Generate a foundational Style Guide (Theme) screen for the project. MUST be called first before any other screen is generated.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: "Must be 'Theme' or 'Style Guide'.",
      },
      prompt: {
        type: Type.STRING,
        description:
          "Instructions for base variables, colors, and typography scales based on the user's initial creative direction.",
      },
      pendingScreenTitle: {
        type: Type.STRING,
        description:
          "The title of the first functional screen to generate after the theme is established.",
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
  execute: async (
    args: any,
    context: {
      userId: string;
      projectId: string;
      onProgress?: (event: any) => void;
    },
  ) => {
    try {
      console.log(`[Tool: generateTheme] Initiating Theme Protocol`);
      const result = await generateThemeSync({
        projectId: context.projectId,
        title: args.title || "Style Guide",
        prompt: args.prompt,
        userId: context.userId,
        onProgress: context.onProgress,
        pendingScreen: args.pendingScreenTitle
          ? {
              title: args.pendingScreenTitle,
              prompt: args.pendingScreenPrompt,
              type: args.pendingScreenType,
            }
          : undefined,
      });

      const hasPending = !!args.pendingScreenTitle;
      return {
        status: "success",
        message: hasPending
          ? `Theme protocol completed. The Style Guide has been successfully generated. Additionally, the first functional screen "${args.pendingScreenTitle}" has also been successfully generated. Do NOT call generateScreen for "${args.pendingScreenTitle}" as it is already created and present on the canvas.`
          : `Theme protocol completed. The Style Guide has been successfully generated.`,
        theme: result.theme,
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
