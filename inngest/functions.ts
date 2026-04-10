import { inngest } from "./client";
import { NonRetriableError } from "inngest";
import { aiService } from "../services/ai.services";
import { z } from "zod";
import {
  ScreenGenerationPrompt,
} from "../lib/prompts";
import prisma from "../lib/prisma";
import { MAXIMUM_OUTPUT_TOKENS } from "../lib/constants";
import {
  publishStatus,
  sanitizeHtmlForContext,
} from "./helpers";
import { consumeCredit } from "../lib/credits";




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
        userId,
      } = event.data;

      // --- PRE-CHECK: VERIFY PROJECT EXISTS ---
      await step.run("check-project-exists", async () => {
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          select: { id: true },
        });

        if (!project) {
          throw new NonRetriableError(`Project ${projectId} not found. Aborted.`);
        }
      });

      // --- STEP 1: CONSUME CREDIT ---
      await step.run("consume-credit", async () => {
        await consumeCredit(userId || "");
      });

      // --- STEP 2: INITIAL PERSISTENCE ---
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
        type: type, // Pass the type here
      });

      // --- STEP 3: GENERATE SCREEN CODE ---
      const htmlCode = await step.run("generate-screen-code", async () => {
        const systemPrompt =
          ScreenGenerationPrompt +
          "\n\nCRITICAL: You are generating a single, high-fidelity screen. Do not use placeholders. Ensure all content is realistic.";

        // Fetch most recent screen for design continuity
        const recentScreen = await prisma.screen.findFirst({
          where: { projectId, id: { not: dbScreen.id }, status: "completed" },
          orderBy: { createdAt: "desc" },
        });

        // Fetch most recent message with images for visual context
        const recentMessages = await prisma.message.findMany({
          where: { projectId, role: "user" },
          orderBy: { createdAt: "desc" },
          take: 5
        });

        const recentScreenWithImages = recentMessages.find(m => 
          (m.parts as any[] || []).some((p: any) => p.type === "image")
        );

        const contextMessages = recentScreen
          ? [
              {
                role: "assistant",
                content: `Recent Screen Context: I recently generated the "${recentScreen.title}" screen. Here is its structural code for continuity:\n\n${sanitizeHtmlForContext(recentScreen.html)}`,
              },
            ]
          : [];

        const rawMessages = [
          { role: "system", content: systemPrompt },
          ...contextMessages,
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Now generate the "${title}" (type: ${type}) screen based on these instructions:\n\n${prompt}`,
              },
              ...(recentScreenWithImages?.parts as any[] || [])
                .filter((p) => p.type === "image")
                .slice(0, 2)
                .map((p) => ({ type: "image_url", image_url: { url: p.path } })),
            ],
          },
          {
            role: "user",
            content: `MANDATORY: Output ONLY the raw HTML and CSS. No markdown code blocks, no conversation, no artifacts.`,
          },
        ] as any;

        const processedMessages = await aiService.processMessages(rawMessages);

        const { text } = await aiService.generateText(processedMessages, {
          temperature: 0.1,
          max_tokens: MAXIMUM_OUTPUT_TOKENS,
          projectId,
        });

        // Simple cleaning to remove any accidental markdown wrapping
        const cleanText = text.replace(/^```html\s*/i, "").replace(/```$/i, "").trim();

        return {
          title: title,
          html: cleanText,
          type: type as any,
        };
      });

      // --- STEP 4: PERSIST & NOTIFY ---
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
