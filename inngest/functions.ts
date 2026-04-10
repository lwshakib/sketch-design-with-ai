import { inngest } from "./client";
import { NonRetriableError } from "inngest";
import { aiService } from "../services/ai.services";
import { z } from "zod";
import {
  ScreenGenerationPrompt,
  ThemeGenerationPrompt,
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

        // Fetch the project's active theme
        let themeContext = "";
        const projectTheme = await prisma.theme.findFirst({
            where: { projectId, isActive: true },
            orderBy: { createdAt: "desc" }
        });
        
        if (projectTheme) {
            themeContext = `\n\nCRITICAL THEME CONTEXT: You MUST strictly use the following design system variables for styling this screen to ensure consistency:\n${JSON.stringify(projectTheme.variables, null, 2)}\n\nDo NOT invent new color HEX codes. Use standard precise classes or inline variables to map to these design tokens.`;
        }

        // Fetch most recent screen for structural continuity
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
          { role: "system", content: systemPrompt + themeContext },
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

// --- Theme Generation Flow ---
export const generateThemeFlow = inngest.createFunction(
  { id: "generate-theme" },
  { event: "app/theme.generate" },
  async ({ event, step, publish }) => {
    try {
      const { projectId, title, prompt, userId } = event.data;

      await step.run("check-project", async () => {
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project) throw new NonRetriableError(`Project ${projectId} not found.`);
      });

      await step.run("consume-credit", async () => {
        await consumeCredit(userId || "");
      });

      // Initial Placeholder
      const dbTheme = await step.run("init-theme", async () => {
        // Deactivate older themes
        await prisma.theme.updateMany({
           where: { projectId },
           data: { isActive: false }
        });
      
        return await prisma.theme.create({
          data: {
            projectId,
            name: title || "Project Theme",
            variables: {}, // Placeholder while generating
            x: -1250, // Far left
            y: -200, // Top area
            isActive: true,
          },
        });
      });

      // Notify UI
      await publishStatus({
        publish,
        projectId,
        message: `Establishing Design System...`,
        status: "generating",
        currentScreen: "Theme",
      });

      // Generate JSON Variables
      const themeVariables = await step.run("generate-theme-json", async () => {
        const systemPrompt =
          ThemeGenerationPrompt +
          "\n\nCRITICAL: You are generating a structured JSON theme, not HTML. Determine the hex colors and fonts according to the user's prompt.";

        const rawMessages = [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Generate a unified theme based on: ${prompt}`,
          },
        ] as any;

        const processedMessages = await aiService.processMessages(rawMessages);

        // Define Zod schema implicitly by the prompt, or just rely on generateObject
        // The generateObject uses JSON mode which helps, but we rely on a strong system prompt for the structure.
        return await aiService.generateObject(processedMessages, { projectId });
      });

      // Update DB
      const finalTheme = await step.run("update-theme-db", async () => {
        return await prisma.theme.update({
          where: { id: dbTheme.id },
          data: {
            name: (themeVariables as any).brandName || dbTheme.name,
            variables: themeVariables as any,
          },
        });
      });

      await publishStatus({
        publish,
        projectId,
        message: "Theme generation complete.",
        status: "complete",
        screen: {
           id: finalTheme.id,
           type: "theme",
           title: finalTheme.name,
           variables: finalTheme.variables,
           isComplete: true
        } as any, 
      });

      // --- Optional: Chain Pending Screen ---
      if (event.data.pendingScreen) {
        await step.sendEvent("trigger-chained-screen", {
          name: "app/screen.generate",
          data: {
            projectId,
            userId,
            title: event.data.pendingScreen.title,
            prompt: event.data.pendingScreen.prompt,
            type: event.data.pendingScreen.type,
          },
        });
      }

      return { success: true };
    } catch (error: any) {
      console.error("[generateThemeFlow] Error:", error);
      await publishStatus({
        publish,
        projectId: event.data.projectId,
        message: error.message || "An error occurred while generating the theme.",
        status: "error",
      });
      if (error instanceof NonRetriableError) {
        return { error: error.message };
      }
      throw error;
    }
  }
);
