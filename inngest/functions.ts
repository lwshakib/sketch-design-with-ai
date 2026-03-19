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
import { extractArtifacts } from "../lib/artifact-renderer";
import { extractHtml as _extractHtml } from "../llm/tools";
import {
  publishStatus,
} from "./helpers";




// --- direct: generate a single screen ---
export const generateScreen = inngest.createFunction(
  { id: "generate-screen", retries: 5 },
  { event: "app/screen.generate" },
  async ({ event, step, publish }) => {
    try {
      const {
        projectId,
        assistantMessageId,
        screenTitle,
        screenContent,
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
            title: screenTitle,
            content: "", // Placeholder
            type: "app",
            status: "generating",
            x: currentX,
            y: 0,
            width,
            height: null,
            generationMessageId: assistantMessageId,
          },
        });
      });

      // Notify UI: Screen is now "Generating"
      await publishStatus({
        publish,
        projectId,
        message: `Building ${screenTitle}...`,
        status: "generating",
        currentScreen: screenTitle,
        screenId: dbScreen.id,
        messageId: assistantMessageId,
      });

      // --- STEP 2: GENERATE SCREEN CODE ---
      const generated = await step.run("generate-screen-code", async () => {
        const inspiration = getAllExamples();
        const systemPrompt =
          ScreenGenerationPrompt +
          "\n\nCRITICAL: You are generating a single, high-fidelity screen. Do not use placeholders. Ensure all content is realistic.";

        // Fetch the most recent screen for design consistency if it exists
        const recentScreen = await prisma.screen.findFirst({
          where: { projectId },
          orderBy: { createdAt: "desc" },
          take: 1,
        });

        const contextMessages = recentScreen
          ? [
              {
                role: "assistant",
                content: `Project Design Continuity: Previously, I generated the "${recentScreen.title}" screen. Use its style (colors, typography, corner radius) as a foundation for consistency. Here is its code for reference:\n\n${recentScreen.content}`,
              },
            ]
          : [];

        const { text } = await generateText({
          system: systemPrompt,
          messages: [
            ...contextMessages,
            {
              role: "user",
              content: `Now generate the "${screenTitle}" (type: app) screen based on these instructions:\n\n${screenContent}`,
            },
            {
              role: "user",
              content: `Here are several high-fidelity design examples available. Use them as references for component structure and quality:\n\n${inspiration}`,
            },
            {
              role: "user",
              content: `CRITICAL FORMAT: Wrap the final code in a single <artifact type="app" title="${screenTitle}"> block. Use strict Tailwind classes.`,
            },
          ] as any,
          maxOutputTokens: MAXIMUM_OUTPUT_TOKENS,
          temperature: 0.7,
        });

        const artifacts = extractArtifacts(text);
        return (
          artifacts[0] || {
            title: screenTitle,
            content: text,
            type: "app",
          }
        );
      });

      // --- STEP 3: PERSIST & NOTIFY ---
      const finalScreen = await step.run("update-screen-db", async () => {
        return await prisma.screen.update({
          where: { id: dbScreen.id },
          data: {
            title: generated.title || screenTitle,
            content: generated.content,
            type: (generated.type as any) || "app",
            status: "completed",
            updatedAt: new Date(),
          },
        });
      });

      // Update the final assistant message
      await step.run("finalize-message", async () => {
        await prisma.message.update({
          where: { id: assistantMessageId },
          data: {
            parts: [
              {
                type: "text",
                text: `I have architected and generated the **${screenTitle}** screen on your canvas based on our discussion.`,
              },
            ],
            status: "completed",
          },
        });
      });

      // Notify UI of completion
      await publishStatus({
        publish,
        projectId,
        message: `${screenTitle} complete.`,
        status: "partial_complete",
        screen: finalScreen,
        messageId: assistantMessageId,
      });

      await publishStatus({
        publish,
        projectId,
        message: "Generation complete.",
        status: "complete",
        messageId: assistantMessageId,
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
        messageId: event.data.assistantMessageId,
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
