import prisma from "./prisma";
import { consumeCredit } from "./credits";
import { generateText, generateTextStream } from "../llm/generateText";
import { generateObject } from "../llm/generateObject";
import { ScreenGenerationPrompt, ThemeGenerationPrompt } from "./prompts";

async function publishRealtimeStatus(args: any) {
  console.log(`[Status update] ${args.message || args.status || ""}`);
}

function tryParsePartialJson(jsonStr: string): any {
  let cleaned = jsonStr.trim();
  if (!cleaned) return null;
  if (!cleaned.startsWith("{")) return null;

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    let openBraces = 0;
    let inString = false;
    let escaped = false;

    for (let i = 0; i < cleaned.length; i++) {
      const char = cleaned[i];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (!inString) {
        if (char === "{") openBraces++;
        else if (char === "}") openBraces--;
      }
    }

    let repaired = cleaned;
    if (inString) {
      repaired += '"';
    }
    while (openBraces > 0) {
      repaired += "}";
      openBraces--;
    }

    try {
      return JSON.parse(repaired);
    } catch (err) {
      return null;
    }
  }
}

function sanitizeHtmlForContext(html: string): string {
  if (!html) return "";
  const rootVarsMatch = html.match(/:root\s*{([^}]+)}/i);
  const rootVars = rootVarsMatch ? rootVarsMatch[0] : "";
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let bodyContent = bodyMatch ? bodyMatch[1] : html;
  bodyContent = bodyContent
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");
  bodyContent = bodyContent.replace(/\s+/g, " ").trim();
  return `
<style>${rootVars}</style>
<body>${bodyContent}</body>
`.trim();
}

export interface PendingScreen {
  title: string;
  prompt: string;
  type: "app" | "web";
}

export async function generateScreenSync({
  projectId,
  userId,
  title,
  prompt,
  type,
  onProgress,
}: {
  projectId: string;
  userId: string;
  title: string;
  prompt: string;
  type: "app" | "web";
  onProgress?: (event: any) => void;
}) {
  try {
    console.log(`[generateScreenSync] Initiating for: ${title}`);

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });
    if (!project) throw new Error(`Project ${projectId} not found.`);

    // 1. Consume credit
    await consumeCredit(userId || "");

    // 2. Initial Placeholder placement
    const [screens, themes] = await Promise.all([
      prisma.screen.findMany({ where: { projectId } }),
      prisma.theme.findMany({ where: { projectId } }),
    ]);

    // Find active theme or last theme to determine row Y Y-coordinate
    const activeTheme =
      themes.find((t) => t.isActive) || themes[themes.length - 1];
    const targetY = activeTheme
      ? activeTheme.y
      : -((type === "web" ? 700 : 800) / 2);

    const allArtifacts = [
      ...screens.map((s) => ({ x: s.x, y: s.y, width: s.width, type: s.type })),
      ...themes.map((t) => ({
        x: t.x,
        y: t.y,
        width: t.width || 1200,
        type: "theme",
      })),
    ];

    // Find elements on the same row (within 500px of targetY)
    const rowElements = allArtifacts.filter(
      (a) => a.y !== null && Math.abs(a.y - targetY) < 500,
    );

    let currentX;
    const width = type === "web" ? 1280 : 380;
    if (rowElements.length === 0) {
      currentX = -width / 2;
    } else {
      let maxX = -99999;
      rowElements.forEach((el) => {
        const getWidth = (t: string) =>
          t === "app" ? 380 : t === "web" ? 1280 : 1200;
        const w = el.width || getWidth(el.type);
        const right = (el.x || 0) + w;
        if (right > maxX) maxX = right;
      });
      currentX = maxX + 120;
    }

    const dbScreen = await prisma.screen.create({
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

    // Notify UI immediately that the screen was created (for shimmer placeholder)
    if (onProgress) {
      onProgress({
        type: "screen_created",
        screen: {
          id: dbScreen.id,
          title: dbScreen.title,
          html: "",
          type: dbScreen.type,
          isComplete: false,
          x: dbScreen.x,
          y: dbScreen.y,
          width: dbScreen.width,
          height: dbScreen.height,
          status: "generating",
        },
      });
    }

    // Notify UI: Screen is now "Generating"
    await publishRealtimeStatus({
      projectId,
      message: `Building ${title}...`,
      status: "generating",
      currentScreen: title,
      screenId: dbScreen.id,
      type: type,
      x: dbScreen.x,
      y: dbScreen.y,
    });

    // 3. Generate HTML code
    const platformInstruction =
      type === "app"
        ? "CRITICAL PLATFORM DIRECTIVE: You are generating a MOBILE APP UI (Viewport: 380px width, 800px height). You MUST design it strictly as a native mobile app screen, NOT a desktop website. Use compact elements: a mobile status bar (time, signal, battery icons), a clean header with a back button and title, vertical lists, swipable or tabbed selectors, a sticky bottom tab navigation bar (Home, Search, Cart, Profile), and high-contrast call-to-actions. Avoid wide desktop grid columns, large cards with p-12 padding, and horizontal top navigation links."
        : "CRITICAL PLATFORM DIRECTIVE: You are generating a WEB PAGE/WEB APP UI (Desktop/Responsive layout). Use a full-bleed grid layout, responsive bento structure, horizontal top navigation header with branding and menu options, desktop search bars, and full-scale dashboard/landing page sections.";

    const systemPrompt =
      ScreenGenerationPrompt +
      "\n\nCRITICAL: You are generating a single, high-fidelity screen. Do not use placeholders. Ensure all content is realistic." +
      `\n\n${platformInstruction}`;

    // Fetch the project's active theme or the most recent theme
    let themeContext = "";
    if (activeTheme) {
      const vars = (activeTheme.variables as any) || {};
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
      take: 5,
    });

    const recentScreenWithImages = recentMessages.find((m) =>
      ((m.parts as any[]) || []).some((p: any) => p.type === "image"),
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
          ...((recentScreenWithImages?.parts as any[]) || [])
            .filter((p) => p.type === "image")
            .slice(0, 2)
            .map((p) => ({
              type: "image_url",
              image_url: { url: p.path || p.url },
            })),
        ],
      },
      {
        role: "user",
        content: `MANDATORY: Output ONLY the raw HTML and CSS. No markdown code blocks, no conversation, no artifacts.`,
      },
    ] as any;

    const stream = generateTextStream(rawMessages, { projectId });
    let accumulatedText = "";
    let lastPublishTime = Date.now();

    for await (const chunk of stream) {
      accumulatedText += chunk;

      let cleanText = accumulatedText
        .replace(/^```html\s*/i, "")
        .replace(/```$/i, "")
        .trim();

      // Trigger progressive streaming updates back to client
      if (Date.now() - lastPublishTime > 100 && onProgress) {
        onProgress({
          type: "screen_progress",
          screenId: dbScreen.id,
          html: cleanText,
        });
        lastPublishTime = Date.now();
      }
    }

    const cleanText = accumulatedText
      .replace(/^```html\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    // Trigger final visual stream completion
    if (onProgress) {
      onProgress({
        type: "screen_progress",
        screenId: dbScreen.id,
        html: cleanText,
      });
    }

    // 4. Update DB & Publish Completion
    const finalScreen = await prisma.screen.update({
      where: { id: dbScreen.id },
      data: {
        title: title,
        html: cleanText,
        type: type as any,
        width: type === "web" ? 1280 : 380,
        status: "completed",
        updatedAt: new Date(),
      },
    });

    await publishRealtimeStatus({
      projectId,
      message: "Generation complete.",
      status: "complete",
      screen: {
        ...finalScreen,
        isComplete: true,
      },
    });

    return { success: true, screen: finalScreen };
  } catch (error: any) {
    console.error("[generateScreenSync] Error:", error);
    await publishRealtimeStatus({
      projectId,
      message:
        error.message || "An error occurred while generating the screen.",
      status: "error",
    });
    throw error;
  }
}

export async function generateThemeSync({
  projectId,
  userId,
  title,
  prompt,
  onProgress,
  pendingScreen,
}: {
  projectId: string;
  userId: string;
  title: string;
  prompt: string;
  onProgress?: (event: any) => void;
  pendingScreen?: PendingScreen;
}) {
  try {
    console.log(`[generateThemeSync] Initiating for: ${title}`);

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });
    if (!project) throw new Error(`Project ${projectId} not found.`);

    // 1. Consume credit
    await consumeCredit(userId || "");

    // 2. Initial Placeholder setup
    // Deactivate older themes
    await prisma.theme.updateMany({
      where: { projectId },
      data: { isActive: false },
    });

    const themes = await prisma.theme.findMany({
      where: { projectId },
    });

    const getRowY = (n: number) => -400 + (n - 1) * 1000;
    let chosenRow = 1;
    while (true) {
      const yCenter = getRowY(chosenRow);
      const isOccupied = themes.some((t) => Math.abs(t.y - yCenter) < 500);
      if (!isOccupied) {
        break;
      }
      chosenRow++;
    }

    const currentY = getRowY(chosenRow);
    const currentX = -1200 / 2; // Theme width is 1200

    const dbTheme = await prisma.theme.create({
      data: {
        projectId,
        name: title || "Project Theme",
        variables: {}, // Placeholder while generating
        x: currentX,
        y: currentY,
        isActive: true,
      },
    });

    // Notify UI immediately that the theme was created (for dynamic card setup)
    if (onProgress) {
      onProgress({
        type: "theme_created",
        theme: {
          id: dbTheme.id,
          title: dbTheme.name,
          type: "theme",
          variables: {},
          isComplete: false,
          x: dbTheme.x,
          y: dbTheme.y,
          isActive: true,
        },
      });
    }

    // Notify UI
    await publishRealtimeStatus({
      projectId,
      message: `Establishing Design System...`,
      status: "generating",
      currentScreen: "Theme",
      screenId: dbTheme.id,
      type: "theme",
      x: dbTheme.x,
      y: dbTheme.y,
    });

    // 3. Generate structured JSON theme variables
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

    const stream = generateTextStream(rawMessages, { projectId });
    let accumulatedText = "";
    let lastPublishTime = Date.now();
    let themeVariables: any = {};

    for await (const chunk of stream) {
      accumulatedText += chunk;

      const partialObj = tryParsePartialJson(accumulatedText);
      if (partialObj && onProgress) {
        themeVariables = partialObj;
        if (Date.now() - lastPublishTime > 100) {
          onProgress({
            type: "theme_progress",
            themeId: dbTheme.id,
            variables: themeVariables,
            title: themeVariables.brandName || dbTheme.name,
          });
          lastPublishTime = Date.now();
        }
      }
    }

    try {
      themeVariables = JSON.parse(accumulatedText);
    } catch (e) {
      // Keep using repaired JSON from tryParsePartialJson
    }

    if (onProgress) {
      onProgress({
        type: "theme_progress",
        themeId: dbTheme.id,
        variables: themeVariables,
        title: themeVariables.brandName || dbTheme.name,
      });
    }

    // 4. Update DB & Publish
    const finalTheme = await prisma.theme.update({
      where: { id: dbTheme.id },
      data: {
        name: themeVariables.brandName || dbTheme.name,
        variables: themeVariables as any,
      },
    });

    await publishRealtimeStatus({
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
        isActive: true,
      } as any,
    });

    // 5. Chain pending screen generation
    if (pendingScreen) {
      await generateScreenSync({
        projectId,
        userId,
        title: pendingScreen.title,
        prompt: pendingScreen.prompt,
        type: pendingScreen.type,
        onProgress,
      });
    }

    return { success: true, theme: finalTheme };
  } catch (error: any) {
    console.error("[generateThemeSync] Error:", error);
    await publishRealtimeStatus({
      projectId,
      message: error.message || "An error occurred while generating the theme.",
      status: "error",
    });
    throw error;
  }
}
