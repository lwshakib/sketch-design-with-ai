import { inngest } from "./client";
import { NonRetriableError } from "inngest";
import { generateText } from "../llm/generate-text";
import { z } from "zod";
import {
  ScreenGenerationPrompt,
} from "../llm/prompts";
import { getAllExamples } from "../llm/helpers";
import prisma from "../lib/prisma";
import { MAXIMUM_OUTPUT_TOKENS } from "../lib/constants";
import { extractHtml as _extractHtml } from "../llm/tools";
import {
  publishStatus,
} from "./helpers";




// --- direct: generate a single screen ---
export const generateScreen = inngest.createFunction(
  { id: "generate-screen" },
  { event: "app/screen.generate" },
  async ({ event, step, publish }) => {
    try {
      const {
        projectId,
        title,
        prompt,
        type,
      } = event.data;

      // --- STEP 1: INITIAL PERSISTENCE ---
      // Position the screen and create placeholder in DB
      const dbScreen = await step.run("init-screen-placeholder", async () => {
        const lastScreen = await prisma.screen.findFirst({
          where: { projectId },
          orderBy: { x: "desc" },
        });

        // Use a standard app width for placeholder (380px)
        const width = 380;
        const currentX = lastScreen
          ? lastScreen.x + (lastScreen.width || 380) + 120
          : 0;

        return await prisma.screen.create({
          data: {
            projectId,
            title: title,
            html: "", // Placeholder
            type: type as any,
            status: "generating",
            x: currentX,
            y: 0,
            width,
            height: null,
          },
        });
      });

      // Notify UI: Screen is now "Generating"
      await publishStatus({
        publish,
        projectId,
        message: `Building ${title}...`,
        status: "generating",
        currentScreen: title,
        screenId: dbScreen.id,
      });

      // --- STEP 2: GENERATE SCREEN CODE ---
      const htmlCode = await step.run("generate-screen-code", async () => {
        const inspiration = getAllExamples();
        const systemPrompt =
          ScreenGenerationPrompt +
          "\n\nCRITICAL: You are generating a single, high-fidelity screen. Do not use placeholders. Ensure all content is realistic.";

        // Fetch the most recent completed screen for design consistency if it exists
        const recentScreen = await prisma.screen.findFirst({
          where: { projectId, status: "completed" },
          orderBy: { createdAt: "desc" },
          take: 1,
        });

        const contextMessages = recentScreen
          ? [
              {
                role: "assistant",
                content: `Recent Screen Context: I recently generated the "${recentScreen.title}" screen. Here is its code for reference to ensure continuity:\n\n${recentScreen.html}`,
              },
            ]
          : [];

        const { text } = await generateText({
          messages: [
            { role: "system", content: systemPrompt },
            ...contextMessages,
            {
              role: "user",
              content: `Now generate the "${title}" (type: ${type}) screen based on these instructions:\n\n${prompt}`,
            },
            {
              role: "user",
              content: `Here are several high-fidelity design examples available. Use them as references for component structure and quality:\n\n${inspiration}`,
            },
            {
              role: "user",
              content: `MANDATORY: Output ONLY the raw HTML and CSS. No markdown code blocks, no conversation, no artifacts.`,
            },
          ] as any,
          maxOutputTokens: MAXIMUM_OUTPUT_TOKENS,
          temperature: 0.5, // Lower temperature for more strict adherence to format
        });

        // Simple cleaning to remove any accidental markdown wrapping
        const cleanText = text.replace(/^```html\s*/i, "").replace(/```$/i, "").trim();

        return {
          title: title,
          html: cleanText,
          type: type as any,
        };
      });

      // --- STEP 3: PERSIST & NOTIFY ---
      const finalScreen = await step.run("update-screen-db", async () => {
        return await prisma.screen.update({
          where: { id: dbScreen.id },
          data: {
            title: htmlCode.title || title,
            html: htmlCode.html,
            type: (htmlCode.type as any) || "app",
            status: "completed",
            updatedAt: new Date(),
          },
        });
      });

      await publishStatus({
        publish,
        projectId,
        message: "Generation complete.",
        status: "complete",
        screen: finalScreen,
      });

      return { success: true };
    } catch (error: any) {
      console.error("[generateScreen] Error:", error);

      await publishStatus({
        publish,
        projectId: event.data.projectId,
        message:
          error.message || "An error occurred while generating the screen.",
        status: "error",
      });

      if (error instanceof NonRetriableError) {
        return { error: error.message };
      }
      throw error;
    }
  },
);



// --- Daily Credit Reset ---
/*
export const dailyCreditReset = inngest.createFunction(
  { id: "daily-credit-reset" },
  { cron: "0 0 * * *" }, // Midnight every day
  async ({ step }) => {
    await step.run("reset-all-credits", async () => {
      await prisma.user.updateMany({
        data: {
          credits: 50000,
          lastReset: new Date(),
        },
      });
    });
  },
);
*/
