import { inngest } from "./client";
import { stepCountIs } from "ai";
import { generateText, generateObject } from "../llm/generate";
import { z } from "zod";
import { GeminiModel } from "../llm/model";
import { 
  InitialResponsePrompt, 
  PlanningPrompt, 
  ScreenGenerationPrompt,
} from "../llm/prompts";
import { getAllExamples } from "../llm/helpers";
import prisma from "../lib/prisma";
import { MAXIMUM_OUTPUT_TOKENS } from "../lib/constants";
import { extractArtifacts } from "../lib/artifact-renderer";
import { recordCreditUsage } from "../lib/credits";

// Helper: Fetch images and convert to base64 for AI
async function hydrateImages(messages: any[]) {
  return await Promise.all(messages.map(async (msg) => {
    if (msg.role === 'user' && Array.isArray(msg.content)) {
      const newContent = await Promise.all(msg.content.map(async (part: any) => {
        if (part.type === 'image' && typeof part.image === 'string' && part.image.startsWith('http')) {
          try {
            console.log("Hydrating image:", part.image);
            const res = await fetch(part.image);
            const arrayBuffer = await res.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString('base64');
            const mime = res.headers.get('content-type') || 'image/jpeg';
            // Vercel SDK expects base64 data URI or just base64? 
            // Docs say data URI is safe. 
            // Actually for `experimental_attachment` it might be different, but for `content` array with `type: image`, usually data URI or URL.
            // User requested base64. Data URI is standard.
            return { ...part, image: `data:${mime};base64,${base64}` };
          } catch (e) {
            console.error("Failed to fetch image for hydration:", part.image, e);
            return part; 
          }
        }
        return part;
      }));
      return { ...msg, content: newContent };
    }
    return msg;
  }));
}



interface PlanScreen {
  title: string;
  type: 'web' | 'app';
  description: string;
}

interface Plan {
  screens: PlanScreen[];
  themes?: any[];
}



// --- orchestrator: generate whole design ---
export const generateDesign = inngest.createFunction(
  { id: "generate-design", retries: 5 },
  { event: "app/design.generate" },
  async ({ event, step, publish }) => {
    const { messages, projectId, is3xMode, websiteUrl, isSilent } = event.data;
    
    // Normalize messages
    const safeMessages = (Array.isArray(messages) ? messages : []).filter(m => m.content);

    // --- STEP PRE-0: INITIAL PERSISTENCE ---
    // Create the assistant message immediately so it shows up on UI
    const messageId = await step.run("save-initial-assistant-message", async () => {
      if (isSilent) return null;
      const msg = await prisma.message.create({
        data: {
          projectId: projectId,
          role: "assistant",
          content: "*Analyzing your request and architecting project manifest...*",
          status: "generating",
        },
      });
      return msg.id;
    });

    // --- STEP 0: FETCH WEBSITE REFERENCE ---
    let websiteReferenceContext = "";
    if (websiteUrl) {
      websiteReferenceContext = await step.run("fetch-website-reference", async () => {
        try {
          const response = await fetch(websiteUrl);
          if (!response.ok) return `Failed to fetch website context from ${websiteUrl}`;
          const html = await response.text();
          // Extract title if exists
          const titleMatch = html.match(/<title>(.*?)<\/title>/i);
          const title = titleMatch ? titleMatch[1] : "";
          // Extract body text (very stripped down to save tokens)
          const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
          let body = bodyMatch ? bodyMatch[1] : html;
          // Strip tags and excessive whitespace
          body = body.replace(/<script[\s\S]*?<\/script>/gi, '')
                     .replace(/<style[\s\S]*?<\/style>/gi, '')
                     .replace(/<[^>]+>/g, ' ')
                     .replace(/\s+/g, ' ')
                     .trim()
                     .slice(0, 4000); // Take first 4000 chars

          return `Reference Website Context (${websiteUrl}):\nTitle: ${title}\nContent Summary: ${body}`;
        } catch (error) {
          console.error("Failed to fetch website reference:", error);
          return `Error fetching website reference from ${websiteUrl}`;
        }
      });
    }

    // --- STEP 1 & 2: VISION & PLANNING ---
    await publish({
      channel: `project:${projectId}`,
      topic: "status",
      data: { message: "Synthesizing design vision...", status: "vision" }
    });

    const { plan, vision, conclusionText, suggestion } = await step.run("generate-design-manifest", async () => {
      // Check credits (1000)
      const proj = await prisma.project.findUnique({
          where: { id: projectId },
          select: { userId: true }
      });
      if (!proj) throw new Error("Project not found");
      const user = await prisma.user.findUnique({
          where: { id: proj.userId },
          select: { credits: true }
      });
      if (!user || user.credits < 1000) throw new Error("Insufficient credits for planning");

      // Normalize messages
      let stepMessages = Array.isArray(messages) ? messages : [];
      if (stepMessages.length === 0) {
        stepMessages = [{ role: 'user', content: 'Create a modern design' }];
      } else {
        stepMessages = await hydrateImages(stepMessages);
      }
      
      const inspiration = getAllExamples();

      let systemPrompt = PlanningPrompt + `\n\nUse these high-fidelity design examples as your primary inspiration for quality and code structure:\n${inspiration}`;
      
      systemPrompt += `\n\nCRITICAL ON REGENERATION: If the user explicitly asks to 'Regenerate' a specific screen (especially if no other instructions are provided), you MUST provide a fundamentally different layout, structural composition, and visual rhythm for that screen. Avoid repeating the previous design structure. Rethink the wireframe from scratch while maintaining the core feature set and the selected theme.`;
      
      if (websiteReferenceContext) {
        systemPrompt += `\n\nCRITICAL: The user has provided a reference website. Study its content, structure, and style to inform your design plan:\n${websiteReferenceContext}`;
      }

      const { object } = await generateObject({
        system: systemPrompt,
        messages: stepMessages as any,
        schema: z.object({
          vision: z.string().describe("A single, high-fidelity sentence describing the core visual style and design philosophy."),
          themes: z.array(z.object({
            name: z.string(),
            colors: z.object({
              background: z.string(),
              foreground: z.string(),
              primary: z.string(),
              primaryForeground: z.string(),
              secondary: z.string(),
              secondaryForeground: z.string(),
              muted: z.string(),
              mutedForeground: z.string(),
              accent: z.string(),
              accentForeground: z.string(),
              border: z.string(),
              input: z.string(),
              ring: z.string(),
              radius: z.string(),
              card: z.string(),
              cardForeground: z.string(),
              popover: z.string(),
              popoverForeground: z.string(),
            })
            })).min(1),
          screens: z.array(z.object({
            title: z.string(),
            type: z.enum(['web', 'app']),
            description: z.string(),
            prompt: z.string().describe("Extremely detailed, technical prompt for generating this specific screen's code, including layout, components, and interaction states.")
          })),
          conclusionText: z.string().describe("A detailed Markdown summary. Format: 'The [Screen Title] screens have been architected:', followed by a bulleted list '* **[Title]**: [Description]', ending with a follow-up question."),
          suggestion: z.string().describe("A single, proactive suggestion for an additional full SCREEN (not just a modal, component, or dialog) that would complement the current design plan. Format as a question.")
        })
      });
      let finalScreens = object.screens;
      let finalConclusion = object.conclusionText;

      if (is3xMode) {
        finalScreens = object.screens.flatMap((screen: any) => [
          { 
            ...screen, 
            title: `${screen.title} (Variation A)`, 
            prompt: `${screen.prompt}\n\n[VARIATION A: MINIMALIST & CONVENTIONAL]\nLAYOUT: Use a standard, highly intuitive industry-standard layout (e.g., classic top-navigation or centered content). \nSTYLE: Focus on extreme clarity, airy whitespace, and 'Apple-style' minimalism. Avoid complex decorations. Use light accents and generous padding. This should be the 'Safest' and most 'Clean' version.` 
          },
          { 
            ...screen, 
            title: `${screen.title} (Variation B)`, 
            prompt: `${screen.prompt}\n\n[VARIATION B: BENTO & INFORMATION DENSITY]\nLAYOUT: Use a sophisticated 'Bento-Box' grid system. Organize information into distinct, multi-layered card modules of varying sizes. \nSTYLE: Focus on structural depth, thin sophisticated borders, and high information density. Use subtle shadows and layered components. This should feel like a 'Professional Tool' or 'Power-User' dashboard.` 
          },
          { 
            ...screen, 
            title: `${screen.title} (Variation C)`, 
            prompt: `${screen.prompt}\n\n[VARIATION C: EXPERIMENTAL & BRAND-LED]\nLAYOUT: Break the standard grid. Use asymmetric placements, organic overlapping elements, and dynamic vertical rhythms. \nSTYLE: Focus on bold creative expression, vibrant gradients, and experimental visual rhythm. Use unique brand shapes, large expressive typography, and a memorable, 'Award-Winning' creative aesthetic.` 
          }
        ]);

        // Create a custom conclusion that summarizes the variations
        finalConclusion = `### Multi-Variation Design Manifest\n\nI have architected 3 distinct visual variations (A, B, and C) for each of your requested screens. This allows you to explore different aesthetic directions for the same core features:\n\n` + 
          object.screens.map((s: any) => `* **${s.title}**: Expanding into 3 visual concepts.`).join('\n') +
          `\n\nI am now generating all ${finalScreens.length} variations on your canvas. Which direction feels most aligned with your brand?`;
      }

      const planJson = { 
        screens: finalScreens, 
        themes: object.themes,
        conclusionText: finalConclusion,
        suggestion: object.suggestion
      };
      
      // Update Project with themes
      if (object.themes && object.themes.length > 0) {
        await prisma.project.update({
          where: { id: projectId },
          data: { themes: object.themes }
        });
      }

      return { 
        plan: planJson, 
        vision: object.vision,
        conclusionText: finalConclusion,
        suggestion: object.suggestion
      };
    });

    // Deduct planning credits
    await step.run("deduct-planning-credits", async () => {
      const proj = await prisma.project.findUnique({
          where: { id: projectId },
          select: { userId: true }
      });
      if (proj) await recordCreditUsage(proj.userId, 1000);
    });

    // Update status to planning
    await publish({
      channel: `project:${projectId}`,
      topic: "status",
      data: { message: vision, status: "vision" }
    });

    // Create placeholder screens in DB so they appear on UI immediately
    const dbScreens = await step.run("init-placeholder-screens", async () => {
      // Get the last screen to determine starting X position
      const lastScreen = await prisma.screen.findFirst({
         where: { projectId: projectId },
         orderBy: { x: 'desc' }
      });

      let currentX = lastScreen 
        ? lastScreen.x + (lastScreen.width || (lastScreen.type === 'app' ? 380 : lastScreen.type === 'web' ? 1024 : 800)) + 120 
        : 0;

      // Adjust for first screen if no previous screens exist
      if (!lastScreen) {
         const firstWidth = plan.screens[0].type === 'app' ? 380 : plan.screens[0].type === 'web' ? 1024 : 800;
         currentX = -(firstWidth / 2);
      }

      const created = [];
      for (const screen of plan.screens) {
         const width = screen.type === 'app' ? 380 : screen.type === 'web' ? 1024 : 800;
         
         const s = await prisma.screen.create({
           data: {
             projectId: projectId,
             title: screen.title,
             content: "", // Empty content = placeholder
             type: screen.type,
             status: "generating",
             x: currentX,
             y: 0,
             width: width,
             height: null
           }
         });
         created.push(s);

         // Increment X for next screen
         currentX += width + 120;
      }
      return created;
    });

    // 2. Initial Publication & Persistence
    // Publish the plan immediately so UI shows squares (including IDs)
    const planWithIds = {
      ...plan,
      screens: plan.screens.map((s: PlanScreen, i: number) => ({ ...s, id: dbScreens[i].id }))
    };

    await publish({
      channel: `project:${projectId}`,
      topic: "plan",
      data: { 
        plan: planWithIds, 
        markdown: vision,
        messageId: messageId
      }
    });

    // Update the assistant message with the vision and plan
    await step.run("update-assistant-message-with-plan", async () => {
      if (!messageId) return;
      await prisma.message.update({
        where: { id: messageId },
        data: {
          content: vision,
          plan: JSON.parse(JSON.stringify(planWithIds))
        },
      });
    });

    // 3. Sequentially generate each screen in the plan
    if (plan.screens.length > 0) {
      let screensContext: { title: string; content: string }[] = [];
      for (let i = 0; i < plan.screens.length; i++) {
        const screen = plan.screens[i];
        if (!screen) continue;
        const screenId = dbScreens[i].id;

        // Notify UI: starting screen
        await publish({
          channel: `project:${projectId}`,
          topic: "status",
          data: { 
            message: `Designing "${screen.title}"...`, 
            status: "generating", 
            currentScreen: screen.title,
            screenId: screenId
          }
        });

        const generatedScreen = await step.run(`generate-screen-${i}`, async () => {
          // Notify inner status
          await publish({
            channel: `project:${projectId}`,
            topic: "status",
            data: { 
              message: `Applying theme to "${screen.title}"...`, 
              status: "generating", 
              currentScreen: screen.title,
              screenId: screenId
            }
          });
          
          const inspiration = getAllExamples();
          
          let systemPrompt = ScreenGenerationPrompt + "\n\nCRITICAL: You are generating a highly detailed, production-ready screen. Do not use placeholders. Ensure all content is realistic and high-fidelity.";

          if (websiteReferenceContext) {
            systemPrompt += `\n\nREFERENCE WEBSITE CONTEXT: The user provided a reference website. Use its structure, content style, and information hierarchy as a guide for this screen:\n${websiteReferenceContext}`;
          }

          // Contextual messages: Vision + Plan + Previous Screens
          const themes = (plan as any).themes || [];
          const selectedTheme = themes.length > 0 ? themes[0] : null;

          await publish({
            channel: `project:${projectId}`,
            topic: "status",
            data: { 
              message: `Building components for "${screen.title}"...`, 
              status: "generating", 
              currentScreen: screen.title,
              screenId: screenId
            }
          });

          const getVariation = (t: string) => {
            const match = t.match(/\(Variation ([ABC])\)/);
            return match ? match[1] : null;
          };
          const currentVariation = getVariation(screen.title);
          
          const compatibleContext = screensContext.filter(s => {
            const v = getVariation(s.title);
            return v === currentVariation;
          });

          const contextMessagesSize = 2; // Last 2 COMPATIBLE screens for context
          const recentContext = compatibleContext.slice(-contextMessagesSize);

          const contextMessages = [
             { role: 'assistant', content: vision || '' },
             { role: 'assistant', content: `Design Plan: ${JSON.stringify({ screens: plan.screens })}` }, // Pass FULL plan for context
             ...recentContext.map(s => ({
                role: 'assistant',
                content: `Earlier, I generated the "${s.title}" screen. Here is its code:\n\n${s.content}`
             }))
          ];
          
          // Hydrate user messages with base64 images
          const hydratedSafeMessages = await hydrateImages(safeMessages);

          const { text } = await generateText({
            system: systemPrompt,
            messages: [
              ...hydratedSafeMessages,
              ...contextMessages,
              { role: 'user', content: `Here are ALL the high-fidelity design examples available. Use them as references for component structure and quality, regardless of their specific type:\n\n${inspiration}` },
              { role: 'user', content: `Now generate the "${screen.title}" (${screen.type}) screen based on the vision, the full plan, and the previous screens provided above. 
Description: ${screen.description}. 
SPECIFIC PROMPT: ${(screen as any).prompt || ''}

${selectedTheme ? `IMPORTANT: Use this theme for the color palette:\n${JSON.stringify(selectedTheme, null, 2)}` : ''}

CRITICAL INSTRUCTIONS:
1. CONSTISTENCY: You MUST use the exact same color palette, typography, and corner variations as the previous screens.
2. DETAIL: The code must be extremely detailed. Use strict Tailwind classes for everything.
3. THEME: Ensure the theme is consistent. If previous screens used a specific background gradient, YOU MUST USE IT TOO.
4. CONTENT: Use realistic data. No 'Lorem Ipsum'.
5. FORMAT: You MUST wrap the code in a single artifact block exactly like this:
<artifact type="${screen.type === 'app' ? 'app' : 'web'}" title="${screen.title}">
... code here ...
</artifact>` }
            ] as any,
            maxOutputTokens: MAXIMUM_OUTPUT_TOKENS,
            temperature: 0.7,
          });

          const artifacts = extractArtifacts(text);
          const artifact = artifacts[0] || { 
            title: screen.title, 
            content: text, 
            type: screen.type 
          };

          // Use type from artifact extraction (already normalized) or fall back to plan type
          const type: 'web' | 'app' = artifact.type === 'app' ? 'app' : screen.type === 'app' ? 'app' : 'web';

          const result = {
            title: artifact.title || screen.title,
            content: artifact.content,
            type
          };

          return result;
        });
        
        // Add to context for next iteration
        screensContext.push({
           title: generatedScreen.title,
           content: generatedScreen.content
        });

        // Save the screen to database and notify UI
        const savedScreen = await step.run(`save-screen-${i}-db`, async () => {
          return await prisma.screen.update({
            where: { id: screenId },
            data: {
              title: generatedScreen.title || screen.title,
              content: generatedScreen.content,
              type: generatedScreen.type,
              status: "completed",
              updatedAt: new Date()
            }
          });
        });

        // Deduct screen credits
        await step.run(`deduct-screen-credits-${i}`, async () => {
          const proj = await prisma.project.findUnique({
              where: { id: projectId },
              select: { userId: true }
          });
          if (proj) await recordCreditUsage(proj.userId, 2000);
        });

        // Notify UI: screen complete with database record
        await publish({
          channel: `project:${projectId}`,
          topic: "status",
          data: { 
            message: `"${screen.title}" complete.`, 
            status: "partial_complete",
            screen: savedScreen
          }
        });
      }

      // --- FINAL STEPS: UPDATE MESSAGE & CONCLUDE ---

      // Update the assistant message with final plan and markdown, mark as completed
      await step.run("update-final-assistant-message", async () => {
        if (!messageId) return;
        await prisma.message.update({
          where: { id: messageId },
          data: {
            content: `Vision: ${vision}\n\nConclusion: ${conclusionText}\n\nSuggestion: ${suggestion}`,
            plan: JSON.parse(JSON.stringify(planWithIds)),
            status: "completed"
          },
        });
      });

      // Stream the final plan and conclusion to the UI
      await publish({
        channel: `project:${projectId}`,
        topic: "plan",
        data: { 
          plan: planWithIds, 
          markdown: `Vision: ${vision}\n\nConclusion: ${conclusionText}\n\nSuggestion: ${suggestion}`,
          messageId: messageId
        }
      });

      // Final completion signal
      await publish({
        channel: `project:${projectId}`,
        topic: "status",
        data: { 
          message: conclusionText, 
          status: "complete",
          isSilent,
          messageId: messageId
        }
      });
    }

    return { success: true };
  }
);

// --- worker: regenerate specific screen ---
export const regenerateScreen = inngest.createFunction(
  { id: "regenerate-screen", retries: 5 },
  { event: "app/screen.regenerate" },
  async ({ event, step, publish }) => {
    const { messages, projectId, screenId, instructions } = event.data;

    // --- STEP 1: FETCH DATA ---
    const screen = await step.run("fetch-screen", async () => {
      return await prisma.screen.findUnique({
        where: { id: screenId },
        include: { project: true }
      });
    });

    if (!screen) return { error: "Screen not found" };

    // --- STEP 1.5: CHECK CREDITS ---
    await step.run("check-regeneration-credits", async () => {
      const user = await prisma.user.findUnique({
        where: { id: (screen as any).project.userId },
        select: { credits: true }
      });
      if (!user || user.credits < 2000) throw new Error("Insufficient credits for screen regeneration");
    });

    // Update screen status to generating
    await step.run("set-screen-status-generating", async () => {
      await prisma.screen.update({
        where: { id: screenId },
        data: { status: "generating" }
      });
    });

    // Notify UI: regeneration started for this screen
    await publish({
      channel: `project:${projectId}`,
      topic: "status",
      data: { 
        message: `Regenerating "${screen.title}"...`, 
        status: "regenerating", 
        screenId: screenId 
      }
    });

    // --- STEP 2: GENERATE NEW CODE ---
    const generatedScreen = await step.run("generate-new-code", async () => {
      // Check for regeneration credits (2000)
      const user = await prisma.user.findUnique({
        where: { id: (screen as any).project.userId },
        select: { credits: true }
      });
      if (!user || user.credits < 2000) throw new Error("Insufficient credits for screen regeneration");

      const inspiration = getAllExamples();
      let systemPrompt = ScreenGenerationPrompt + "\n\nCRITICAL: You are REGENERATING an existing screen. Rethink the layout and visual rhythm entirely while maintaining the core functionality.";
      
      const project = screen.project;
      const themes = project.themes as any || [];
      const selectedTheme = themes.length > 0 ? themes[0] : null;

      const hydratedMessages = await hydrateImages(messages);

      const { text } = await generateText({
        system: systemPrompt,
        messages: [
          ...hydratedMessages,
          { role: 'user', content: `Regenerate the "${screen.title}" (${screen.type}) screen.
Instructions: ${instructions || "Rethink the UI structure entirely while keeping the same theme and core functionality."}

${selectedTheme ? `IMPORTANT: Use this theme for the color palette:\n${JSON.stringify(selectedTheme, null, 2)}` : ''}

CRITICAL INSTRUCTIONS:
1. CONSTISTENCY: You MUST use the exact same color palette and typography as the project.
2. NEW LAYOUT: Do NOT repeat the previous layout. Rethink the component placement.
3. FORMAT: You MUST wrap the code in a single artifact block with title="${screen.title}".` }
        ] as any,
        maxOutputTokens: MAXIMUM_OUTPUT_TOKENS,
        temperature: 0.8, // Slightly higher for more variety
      });

      const artifacts = extractArtifacts(text);
      return artifacts[0] || { title: screen.title, content: text, type: screen.type };
    });

    // Deduct regeneration credits
    await step.run("deduct-regeneration-credits", async () => {
      await recordCreditUsage((screen as any).project.userId, 2000);
    });

    // --- STEP 3: PERSIST & NOTIFY ---
    const updatedScreen = await step.run("update-screen-db", async () => {
      return await prisma.screen.update({
        where: { id: screenId },
        data: {
          content: generatedScreen.content,
          status: "completed",
          updatedAt: new Date()
        }
      });
    });

    await publish({
      channel: `project:${projectId}`,
      topic: "status",
      data: { 
        message: `"${screen.title}" regenerated.`, 
        status: "partial_complete",
        screen: updatedScreen,
        isSilent: true
      }
    });

    await publish({
       channel: `project:${projectId}`,
       topic: "status",
       data: {
          message: `Regeneration of "${screen.title}" complete.`,
          status: "complete",
          isSilent: true
       }
    });

    return { success: true };
  }
);



// --- Daily Credit Reset ---
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
  }
);
