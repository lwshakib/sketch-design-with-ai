import { inngest } from "./client";
import { NonRetriableError } from "inngest";
import { processMessages } from "../llm/utils";
import { generateText } from "../llm/generateText";
import { generateObject } from "../llm/generateObject";
import { z } from "zod";
import {
  ScreenGenerationPrompt,
  ThemeGenerationPrompt,
} from "../lib/prompts";
import prisma from "../lib/prisma";
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
        // Fetch all existing screens and themes in the project
        const [screens, themes] = await Promise.all([
          prisma.screen.findMany({ where: { projectId } }),
          prisma.theme.findMany({ where: { projectId } }),
        ]);

        // Find active theme or last theme to determine row Y
        const activeTheme = themes.find(t => t.isActive) || themes[themes.length - 1];
        const targetY = activeTheme ? activeTheme.y : -((type === "web" ? 700 : 800) / 2);

        const allArtifacts = [
          ...screens.map(s => ({ x: s.x, y: s.y, width: s.width, type: s.type })),
          ...themes.map(t => ({ x: t.x, y: t.y, width: t.width || 1200, type: "theme" })),
        ];

        // Find elements on the same row (within 500px of targetY)
        const rowElements = allArtifacts.filter((a) => a.y !== null && Math.abs(a.y - targetY) < 500);

        let currentX;
        const width = type === "web" ? 1280 : 380;
        if (rowElements.length === 0) {
          currentX = -width / 2;
        } else {
          let maxX = -99999;
          rowElements.forEach((el) => {
            const getWidth = (t: string) => (t === "app" ? 380 : t === "web" ? 1280 : 1200);
            const w = el.width || getWidth(el.type);
            const right = (el.x || 0) + w;
            if (right > maxX) maxX = right;
          });
          currentX = maxX + 120;
        }

        return await prisma.screen.create({
          data: {
            projectId,
            title: title,
            html: "", // Placeholder
            type: type as any,
            status: "generating",
            x: currentX,
            y: targetY,
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
        x: dbScreen.x,
        y: dbScreen.y,
      });

      // --- STEP 3: GENERATE SCREEN CODE ---
      const htmlCode = await step.run("generate-screen-code", async () => {
        const platformInstruction = type === "app"
          ? "CRITICAL PLATFORM DIRECTIVE: You are generating a MOBILE APP UI (Viewport: 380px width, 800px height). You MUST design it strictly as a native mobile app screen, NOT a desktop website. Use compact elements: a mobile status bar (time, signal, battery icons), a clean header with a back button and title, vertical lists, swipable or tabbed selectors, a sticky bottom tab navigation bar (Home, Search, Cart, Profile), and high-contrast call-to-actions. Avoid wide desktop grid columns, large cards with p-12 padding, and horizontal top navigation links."
          : "CRITICAL PLATFORM DIRECTIVE: You are generating a WEB PAGE/WEB APP UI (Desktop/Responsive layout). Use a full-bleed grid layout, responsive bento structure, horizontal top navigation header with branding and menu options, desktop search bars, and full-scale dashboard/landing page sections.";

        const systemPrompt =
          ScreenGenerationPrompt +
          "\n\nCRITICAL: You are generating a single, high-fidelity screen. Do not use placeholders. Ensure all content is realistic." +
          `\n\n${platformInstruction}`;

        // Fetch the project's active theme
        let themeContext = "";
        const projectTheme = await prisma.theme.findFirst({
            where: { projectId, isActive: true },
            orderBy: { createdAt: "desc" }
        });
        
        if (projectTheme) {
            const vars = (projectTheme.variables as any) || {};
            const colors = vars.colors || {};
            const typography = vars.typography || {};
            
            // Check if the background is dark or light using YIQ formula
            const isDark = (() => {
              const bg = colors.background || "#080808";
              let hex = bg.replace(/^#/, "");
              if (hex.length === 3) {
                hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
              }
              if (hex.length !== 6) return true;
              const r = parseInt(hex.substring(0, 2), 16);
              const g = parseInt(hex.substring(2, 4), 16);
              const b = parseInt(hex.substring(4, 6), 16);
              const yiq = (r * 299 + g * 587 + b * 114) / 1000;
              return yiq < 128; // Less than 128 means background is dark
            })();
            
            const modeInstruction = isDark 
              ? "CRITICAL MODE INSTRUCTION: The active theme is strictly DARK MODE (dark background, light text). You MUST build a dark-theme user interface. Ensure cards have dark backgrounds (e.g. bg-[#141414] or bg-black/40), text is light (text-white/text-zinc-200), and all components are optimized for high-contrast dark-theme styling."
              : "CRITICAL MODE INSTRUCTION: The active theme is strictly LIGHT MODE (light background, dark text). You MUST build a light-theme user interface. Do NOT use dark backgrounds or dark cards! Ensure cards have light glassmorphic backgrounds (e.g. bg-white/70 or bg-zinc-50 border-zinc-200/60), text is dark/charcoal (text-zinc-900/text-zinc-800), and all components are optimized for high-contrast light-theme styling.";

            themeContext = `
\n\nCRITICAL THEME CONTEXT: The active theme for this project is loaded. You MUST strictly use these colors and typography properties to ensure design consistency across all screens:
<style_guide_context>
:root {
  --background: ${colors.background || "#080808"};
  --foreground: ${colors.foreground || "#ffffff"};
  --primary: ${colors.primary || "#6366f1"};
  --secondary: ${colors.secondary || "#ec4899"};
  --tertiary: ${colors.tertiary || "#14b8a6"};
  --neutral: ${colors.neutral || "#94a3b8"};
  --border: ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"};
  --card: ${isDark ? "#141414" : "#ffffff"};
  --font-headline: '${typography.headline || "Inter"}', sans-serif;
  --font-body: '${typography.body || "Inter"}', sans-serif;
}
</style_guide_context>

${modeInstruction}

Do NOT invent new colors. Ensure all layout containers, text headers, buttons, cards, hover styles, and active borders strictly map to the active theme colors listed above. Avoid any blue or indigo defaults unless they are explicitly part of the active theme above!
`;
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

        const processedMessages = await processMessages(rawMessages);

        const { text } = await generateText(processedMessages, {
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
        const finalType = (htmlCode.type as any) || type || "app";
        return await prisma.screen.update({
          where: { id: dbScreen.id },
          data: {
            title: htmlCode.title || title,
            html: htmlCode.html,
            type: finalType,
            width: finalType === "web" ? 1280 : 380,
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

        const themes = await prisma.theme.findMany({
          where: { projectId },
        });

        const getRowY = (n: number) => -400 + (n - 1) * 1000;
        let chosenRow = 1;
        while (true) {
          const yCenter = getRowY(chosenRow);
          const isOccupied = themes.some(t => Math.abs(t.y - yCenter) < 500);
          if (!isOccupied) {
            break;
          }
          chosenRow++;
        }

        const currentY = getRowY(chosenRow);
        const currentX = -1200 / 2; // Theme width is 1200
      
        return await prisma.theme.create({
          data: {
            projectId,
            name: title || "Project Theme",
            variables: {}, // Placeholder while generating
            x: currentX,
            y: currentY,
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
        screenId: dbTheme.id,
        type: "theme",
        x: dbTheme.x,
        y: dbTheme.y,
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

        const processedMessages = await processMessages(rawMessages);

        // Define Zod schema implicitly by the prompt, or just rely on generateObject
        // The generateObject uses JSON mode which helps, but we rely on a strong system prompt for the structure.
        return await generateObject(processedMessages, { projectId });
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
           x: finalTheme.x,
           y: finalTheme.y,
           isComplete: true,
           isActive: true
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
