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
  id?: string;
  title: string;
  type: 'web' | 'app';
  description: string;
  prompt?: string;
}

interface Plan {
  screens: PlanScreen[];
  themes?: any[];
  conclusionText?: string;
  suggestion?: string;
}



// --- orchestrator: generate whole design ---
export const generateDesign = inngest.createFunction(
  { id: "generate-design", retries: 5 },
  { event: "app/design.generate" },
  async ({ event, step, publish }) => {
    const { 
      messages, projectId, is3xMode, websiteUrl, isSilent, 
      screenId, instructions,
      isVariations, originalScreenId, optionsCount,
      variationCreativeRange, variationCustomInstructions, variationAspects,
      assistantMessageId: providedMessageId
    } = event.data;
    
    // Normalize messages
    const safeMessages = (Array.isArray(messages) ? messages : []).filter(m => m.content);

    // --- MODE 1: REGENERATION ---
    if (screenId) {
      // --- STEP 1: FETCH DATA ---
      const originalScreen = await step.run("fetch-original-screen", async () => {
        return await prisma.screen.findUnique({
          where: { id: screenId },
          include: { project: true }
        });
      });

      if (!originalScreen) return { error: "Screen not found" };

      // --- STEP 1.5: CHECK CREDITS ---
      await step.run("check-regeneration-credits", async () => {
        const user = await prisma.user.findUnique({
          where: { id: (originalScreen as any).project.userId },
          select: { credits: true }
        });
        if (!user || user.credits < 2000) throw new Error("Insufficient credits for screen regeneration");
      });

      // --- STEP 2: INITIAL PERSISTENCE (Message & New Screen) ---
      const { assistantMessageId, newScreenId } = await step.run("init-regeneration-assets", async () => {
        // Create assistant message ONLY if not provided
        let msgId = providedMessageId;
        if (!msgId) {
          const msg = await prisma.message.create({
            data: {
              projectId: projectId,
              role: "assistant",
              content: `*Architecting refactored layout for "${originalScreen.title}"...*`,
              status: "generating",
            },
          });
          msgId = msg.id;
        }

        // Calculate position for new screen (place it after the rightmost screen)
        const lastScreen = await prisma.screen.findFirst({
          where: { projectId: projectId },
          orderBy: { x: 'desc' }
        });

        const currentX = lastScreen 
          ? lastScreen.x + (lastScreen.width || (lastScreen.type === 'app' ? 380 : 1024)) + 120 
          : originalScreen.x + (originalScreen.width || (originalScreen.type === 'app' ? 380 : 1024)) + 120;
        
        const newScreen = await prisma.screen.create({
          data: {
            projectId: projectId,
            title: `${originalScreen.title} (Refactored)`,
            content: "", // Placeholder
            type: originalScreen.type,
            status: "generating",
            x: currentX,
            y: originalScreen.y,
            width: originalScreen.width || (originalScreen.type === 'app' ? 380 : 1024),
            height: originalScreen.height,
            generationMessageId: msgId
          }
        });

        return { assistantMessageId: msgId, newScreenId: newScreen.id };
      });

      // --- STEP 1.7: GENERATE REGENERATION METADATA ---
      const { conclusionText, suggestion } = await step.run("generate-regeneration-metadata", async () => {
        const hydratedMessages = await hydrateImages(safeMessages);
        const { object } = await generateObject({
          system: PlanningPrompt + "\n\nCRITICAL: The user has requested to REGENERATE/REFACTOR an existing screen. Generate a summary of the refactoring and a suggestion for a COMPLETELY NEW screen (never a regeneration of an existing one) that would complement the existing set and complete the user journey. The suggestion must be a question about adding a new feature or page.",
          messages: [
            ...hydratedMessages,
            { role: 'assistant', content: `I am now regenerating the "${originalScreen.title}" screen based on your instructions: ${instructions || "General refactoring"}.` }
          ] as any,
          schema: z.object({
            conclusionText: z.string().describe("Summary of the refactoring process."),
            suggestion: z.string().describe("A suggestion for a NEW screen (never a regeneration) to add to the project. Format as a question.")
          })
        });
        return object;
      });

      const regenPlan = {
        screens: [{
          id: newScreenId,
          title: `${originalScreen.title} (Refactored)`,
          type: originalScreen.type,
          description: `Refactored version of ${originalScreen.title}`
        }],
        conclusionText,
        suggestion
      };

      // Notify UI: add the message to the sidebar and start generation state
      await publish({
        channel: `project:${projectId}`,
        topic: "plan",
        data: {
          markdown: `*Architecting refactored layout for "${originalScreen.title}"...*`,
          messageId: assistantMessageId,
          plan: regenPlan
        }
      });

      await publish({
        channel: `project:${projectId}`,
        topic: "status",
        data: { 
          message: `Refactoring "${originalScreen.title}"...`, 
          status: "generating", 
          currentScreen: `${originalScreen.title} (Refactored)`,
          screenId: newScreenId,
          messageId: assistantMessageId
        }
      });

      // --- STEP 3: GENERATE NEW CODE ---
      const generatedScreen = await step.run("generate-new-code", async () => {
        const inspiration = getAllExamples();
        const systemPrompt = ScreenGenerationPrompt + "\n\nCRITICAL: You are REGENERATING/REFACTORING an existing screen. Rethink the layout and visual rhythm entirely while maintaining core functionality and branding.";
        
        const project = originalScreen.project;
        const selectedTheme = project.selectedTheme || (project.themes as any[])?.[0] || null;

        const hydratedMessages = await hydrateImages(safeMessages);

        const { text } = await generateText({
          system: systemPrompt,
          messages: [
            ...hydratedMessages,
            { role: 'assistant', content: `Current Screen Code for "${originalScreen.title}":\n\n${originalScreen.content}` },
            { role: 'user', content: `Regenerate the "${originalScreen.title}" (${originalScreen.type}) screen using the code provided above as a reference. 
  Instructions: ${instructions || "Rethink the UI structure entirely while keeping the same theme and core functionality."}

  ${selectedTheme ? `IMPORTANT: Use this theme for the color palette:\n${JSON.stringify(selectedTheme, null, 2)}` : ''}

  CRITICAL INSTRUCTIONS:
  1. CONSISTENCY: You MUST use the exact same color palette and typography as the project.
  2. BACKGROUND: You MUST set the body or main container background to the theme's background color (\`var(--background)\`).
  3. NEW LAYOUT: Do NOT repeat the previous layout. Rethink the component placement and visual rhythm. Rebuild it from the ground up if necessary.
  4. FORMAT: You MUST wrap the code in a single artifact block with title="${originalScreen.title} (Refactored)".` }
          ] as any,
          maxOutputTokens: MAXIMUM_OUTPUT_TOKENS,
          temperature: 0.8,
        });

        const artifacts = extractArtifacts(text);
        return artifacts[0] || { title: `${originalScreen.title} (Refactored)`, content: text, type: originalScreen.type };
      });

      // Deduct regeneration credits
      await step.run("deduct-regeneration-credits", async () => {
        await recordCreditUsage((originalScreen as any).project.userId, 2000);
      });

      // --- STEP 4: PERSIST & NOTIFY ---
      const finalScreen = await step.run("update-screen-db", async () => {
        return await prisma.screen.update({
          where: { id: newScreenId },
          data: {
            title: generatedScreen.title || `${originalScreen.title} (Refactored)`,
            content: generatedScreen.content,
            status: "completed",
            updatedAt: new Date()
          }
        });
      });

      const finalMarkdown = `Conclusion: ${conclusionText}\n\nSuggestion: ${suggestion}`;

      // Update the assistant message
      await step.run("update-regeneration-message", async () => {
        await prisma.message.update({
          where: { id: assistantMessageId },
          data: {
            content: finalMarkdown,
            plan: regenPlan,
            status: "completed"
          },
        });
      });

      // Final completion signals
      await publish({
        channel: `project:${projectId}`,
        topic: "plan",
        data: {
          markdown: finalMarkdown,
          messageId: assistantMessageId,
          plan: regenPlan
        }
      });

      await publish({
        channel: `project:${projectId}`,
        topic: "status",
        data: { 
          message: `"${finalScreen.title}" complete.`, 
          status: "partial_complete",
          screen: finalScreen,
          messageId: assistantMessageId
        }
      });

      await publish({
         channel: `project:${projectId}`,
         topic: "status",
         data: {
            message: `Regeneration complete.`,
            status: "complete",
            messageId: assistantMessageId
         }
      });

      return { success: true };
    }

    // --- MODE 1.5: VARIATIONS ---
    if (isVariations && originalScreenId) {
      // 1. Fetch original screen
      const originalScreen = await step.run("fetch-original-screen-variations", async () => {
        return await prisma.screen.findUnique({
          where: { id: originalScreenId },
          include: { project: true }
        });
      });
      if (!originalScreen) return { error: "Screen not found" };

      // 2. Check credits
      await step.run("check-variation-credits", async () => {
        const user = await prisma.user.findUnique({
          where: { id: (originalScreen as any).project.userId },
          select: { credits: true }
        });
        const required = (optionsCount || 3) * 2000;
        if (!user || user.credits < required) throw new Error(`Insufficient credits for ${optionsCount} variations`);
      });

      // 3. Initial Message
      const messageId = await step.run("init-variations-message", async () => {
        if (providedMessageId) return providedMessageId;
        const msg = await prisma.message.create({
          data: {
            projectId: projectId,
            role: "assistant",
            content: `*Architecting ${optionsCount} variations for "${originalScreen.title}"...*`,
            status: "generating",
          },
        });
        return msg.id;
      });

      // 4. Architect variations
      const { variations, conclusionText, suggestion } = await step.run("architect-variations", async () => {
        const hydratedMessages = await hydrateImages(safeMessages);
        const { object } = await generateObject({
          system: PlanningPrompt + `\n\nCRITICAL: The user wants to generate ${optionsCount} variations of an existing screen. 
CREATIVE RANGE: ${variationCreativeRange} (refine=subtle, explore=notable, reimagine=radical)
ASPECTS TO VARY: ${variationAspects.join(', ')}
${variationCustomInstructions ? `CUSTOM INSTRUCTIONS: ${variationCustomInstructions}` : ""}

Provide a unique title and technical description for each of the ${optionsCount} variations. Focus heavily on the requested aspects while maintaining global project branding.`,
          messages: [
            ...hydratedMessages,
            { role: 'assistant', content: `Source Screen for Variations: "${originalScreen.title}"` }
          ] as any,
          schema: z.object({
            variations: z.array(z.object({
              title: z.string().describe("Variation Title, e.g., 'Modern Minimalist', 'Bento Layout', etc."),
              description: z.string().describe("Short description of what changed in this variation."),
              prompt: z.string().describe("Specific technical instructions for this variation.")
            })).length(optionsCount || 3),
            conclusionText: z.string().describe("A summary of the variations being created."),
            suggestion: z.string().describe("A proactive suggestion for a NEXT NEW screen (not variation) that would complement the project.")
          })
        });
        return object;
      });

      // 5. Create Placeholders
      const dbScreens = await step.run("init-variation-placeholders", async () => {
        const lastScreen = await prisma.screen.findFirst({
          where: { projectId: projectId },
          orderBy: { x: 'desc' }
        });
        let currentX = lastScreen 
          ? lastScreen.x + (lastScreen.width || (lastScreen.type === 'app' ? 380 : 1024)) + 120 
          : originalScreen.x + (originalScreen.width || (originalScreen.type === 'app' ? 380 : 1024)) + 120;
        
        const created = [];
        for (const v of variations) {
          const width = originalScreen.width || (originalScreen.type === 'app' ? 380 : 1024);
          const s = await prisma.screen.create({
            data: {
              projectId: projectId,
              title: v.title,
              content: "",
              type: originalScreen.type,
              status: "generating",
              x: currentX,
              y: originalScreen.y,
              width: width,
              height: originalScreen.height,
              generationMessageId: messageId
            }
          });
          created.push(s);
          currentX += width + 120;
        }
        return created;
      });

      const varPlan = {
        screens: variations.map((v: any, i: number) => ({ ...v, id: dbScreens[i].id, type: originalScreen.type })),
        conclusionText,
        suggestion
      };

      // Notify UI
      await publish({
        channel: `project:${projectId}`,
        topic: "plan",
        data: { 
          plan: varPlan, 
          markdown: `Conclusion: ${conclusionText}\n\nSuggestion: ${suggestion}`, 
          messageId 
        }
      });

      // 6. Generate each variation
      for (let i = 0; i < variations.length; i++) {
        const v = variations[i];
        const screenId = dbScreens[i].id;
        
        await publish({
          channel: `project:${projectId}`,
          topic: "status",
          data: { 
            message: `Building variation: "${v.title}"...`, 
            status: "generating", 
            currentScreen: v.title, 
            screenId,
            messageId
          }
        });

        const generated = await step.run(`generate-variation-${i}`, async () => {
          const systemPrompt = ScreenGenerationPrompt + "\n\nCRITICAL: You are generating a VARIATION of an existing screen. Focus on the specific variation focus and description provided.";
          // ... 
          const project = originalScreen.project;
          const selectedTheme = project.selectedTheme || (project.themes as any[])?.[0] || null;
          const hydratedMessages = await hydrateImages(safeMessages);

          const { text } = await generateText({
            system: systemPrompt,
            messages: [
              ...hydratedMessages,
              { role: 'assistant', content: `Source Screen Code for "${originalScreen.title}":\n\n${originalScreen.content}` },
              { role: 'user', content: `Generate the variation "${v.title}" for the "${originalScreen.title}" screen.
Variation Focus: ${v.description}
Technical Prompt: ${v.prompt}

${selectedTheme ? `Use this theme:\n${JSON.stringify(selectedTheme, null, 2)}` : ''}

CRITICAL: 
1. BACKGROUND: You MUST set the body or main container background to the theme's background color (\`var(--background)\`).
2. WRAP: Wrap code in <artifact title="${v.title}"> block.` }
            ] as any,
            maxOutputTokens: MAXIMUM_OUTPUT_TOKENS,
            temperature: 0.8,
          });
          const arts = extractArtifacts(text);
          return arts[0] || { title: v.title, content: text, type: originalScreen.type };
        });

        const savedVar = await step.run(`save-variation-${i}`, async () => {
          return await prisma.screen.update({
            where: { id: screenId },
            data: { 
              content: generated.content, 
              status: "completed",
              updatedAt: new Date()
            }
          });
        });
        
        await step.run(`deduct-variation-${i}-credits`, async () => {
          await recordCreditUsage((originalScreen as any).project.userId, 2000);
        });

        await publish({
          channel: `project:${projectId}`,
          topic: "status",
          data: { 
            message: `"${v.title}" complete.`, 
            status: "partial_complete", 
            screen: savedVar,
            messageId: messageId
          }
        });
      }

      // 7. Finalize message
      const finalMarkdown = `Conclusion: ${conclusionText}\n\nSuggestion: ${suggestion}`;
      await step.run("finalize-variation-message", async () => {
        await prisma.message.update({
          where: { id: messageId },
          data: { 
            content: finalMarkdown, 
            plan: JSON.parse(JSON.stringify(varPlan)), 
            status: "completed" 
          }
        });
      });

      await publish({
        channel: `project:${projectId}`,
        topic: "plan",
        data: { plan: varPlan, markdown: finalMarkdown, messageId }
      });

      await publish({
        channel: `project:${projectId}`,
        topic: "status",
        data: { 
          message: conclusionText, 
          status: "complete", 
          messageId 
        }
      });

      return { success: true };
    }

    // --- MODE 2: FULL DESIGN GENERATION ---
    // --- STEP PRE-0: INITIAL PERSISTENCE ---
    // Create the assistant message immediately so it shows up on UI
    const messageId = await step.run("save-initial-assistant-message", async () => {
      if (isSilent) return null;
      if (providedMessageId) return providedMessageId;
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

    // --- STEP 1: CREDIT CHECK ---
    await step.run("check-planning-credits", async () => {
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
    });

    // --- STEP 1.5: FETCH EXISTING SCREENS ---
    const existingScreens = await step.run("fetch-existing-screens", async () => {
      return await prisma.screen.findMany({
        where: { projectId: projectId },
        orderBy: { createdAt: 'asc' },
        select: {
          title: true,
          type: true,
          content: true,
        }
      });
    });

    // --- STEP 2: THEME GENERATION (OR FETCH) ---
    await publish({
      channel: `project:${projectId}`,
      topic: "status",
      data: { message: "Exploring color palettes...", status: "vision", messageId }
    });

    const { themes, selectedTheme } = await step.run("generate-design-themes", async () => {
      // Fetch existing
      const proj = await prisma.project.findUnique({
        where: { id: projectId },
        select: { themes: true, selectedTheme: true }
      });
      
      let finalThemes = (proj?.themes as any[]) || [];
      let finalSelectedTheme = (proj?.selectedTheme as any) || null;

      if (finalThemes.length === 0) {
        // Normalize messages
        let stepMessages = Array.isArray(messages) ? messages : [];
        if (stepMessages.length === 0) {
          stepMessages = [{ role: 'user', content: 'Create a modern design' }];
        } else {
          stepMessages = await hydrateImages(stepMessages);
        }

        const { object } = await generateObject({
          system: PlanningPrompt + "\n\nCRITICAL: You are generating exactly 10 high-fidelity color palettes for this project.",
          messages: stepMessages as any,
          schema: z.object({
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
            })).min(10).max(10).describe("Exactly 10 distinct, high-fidelity color palettes.")
          })
        });

        finalThemes = object.themes;
        finalSelectedTheme = finalThemes[0];

        // Update Project
        await prisma.project.update({
          where: { id: projectId },
          data: { 
            themes: finalThemes,
            selectedTheme: finalSelectedTheme
          }
        });
      }

      return { themes: finalThemes, selectedTheme: finalSelectedTheme };
    });

    // --- STEP 3: SCREEN PLANNING ---
    await publish({
      channel: `project:${projectId}`,
      topic: "status",
      data: { message: "Designing screen hierarchy...", status: "vision", messageId }
    });

    const { plan } = await step.run("generate-screens-plan", async () => {
      // Normalize messages
      let stepMessages = Array.isArray(messages) ? messages : [];
      if (stepMessages.length === 0) {
        stepMessages = [{ role: 'user', content: 'Create a modern design' }];
      } else {
        stepMessages = await hydrateImages(stepMessages);
      }

      const inspiration = getAllExamples();
      let systemPrompt = PlanningPrompt + `\n\nYou are generating the detailed plan for each screen. \n\nSELECTED THEME: ${JSON.stringify(selectedTheme || {})}`;
      
      if (existingScreens.length > 0) {
        systemPrompt += `\n\nEXISTING SCREENS IN PROJECT (ordered from oldest to newest):\n${JSON.stringify(existingScreens.map(s => ({ title: s.title, type: s.type })), null, 2)}`;
        const lastScreen = existingScreens[existingScreens.length - 1];
        systemPrompt += `\n\nCRITICAL - LAST GENERATED SCREEN: "${lastScreen.title}" (Type: ${lastScreen.type}). You MUST prioritize this screen's type for any new screens added to the plan to ensure sequential consistency.`;
      }

      systemPrompt += `\n\nUse these high-fidelity design examples as your primary inspiration for quality and code structure:\n${inspiration}`;

      if (websiteReferenceContext) {
        systemPrompt += `\n\nCRITICAL: The user has provided a reference website. Study its content, structure, and style to inform your design plan:\n${websiteReferenceContext}`;
      }

      const { object } = await generateObject({
        system: systemPrompt,
        messages: stepMessages as any,
        schema: z.object({
          conclusionText: z.string().describe("A detailed Markdown summary. Format: 'The [Screen Title] screens have been architected:', followed by a bulleted list '* **[Title]**: [Description]', ending with a follow-up question."),
          suggestion: z.string().describe("A single, proactive suggestion for an additional full SCREEN (not just a modal, component, or dialog) that would complement the current design plan. Format as a question."),
          screens: z.array(z.object({
            title: z.string(),
            type: z.enum(['web', 'app']),
            description: z.string(),
            prompt: z.string().describe("Extremely detailed, technical prompt for generating this specific screen's code, including layout, components, and interaction states.")
          }))
        })
      });

      let finalScreens = object.screens as PlanScreen[];
      let finalConclusion = object.conclusionText;
      let finalSuggestion = object.suggestion;

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

      return {
        plan: {
          screens: finalScreens,
          themes: themes,
          conclusionText: finalConclusion,
          suggestion: finalSuggestion
        }
      };
    }) as { plan: Plan };

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
      data: { message: "Finalizing design manifest...", status: "vision", messageId }
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
             height: null,
             generationMessageId: messageId
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
        markdown: `Conclusion: ${plan.conclusionText}\n\nSuggestion: ${plan.suggestion}`,
        messageId: messageId
      }
    });

    // Update the assistant message with the vision and plan
    await step.run("update-assistant-message-with-plan", async () => {
      if (!messageId) return;
      await prisma.message.update({
        where: { id: messageId },
        data: {
          content: `Conclusion: ${plan.conclusionText}\n\nSuggestion: ${plan.suggestion}`,
          plan: JSON.parse(JSON.stringify(planWithIds))
        },
      });
    });

    // 3. Sequentially generate each screen in the plan
    if (plan.screens.length > 0) {
      const screensContext: { title: string; content: string }[] = existingScreens.map(s => ({
        title: s.title,
        content: s.content
      }));
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
            screenId: screenId,
            messageId
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
              screenId: screenId,
              messageId
            }
          });
          
          const inspiration = getAllExamples();
          
          let systemPrompt = ScreenGenerationPrompt + "\n\nCRITICAL: You are generating a highly detailed, production-ready screen. Do not use placeholders. Ensure all content is realistic and high-fidelity.";

          if (websiteReferenceContext) {
            systemPrompt += `\n\nREFERENCE WEBSITE CONTEXT: The user provided a reference website. Use its structure, content style, and information hierarchy as a guide for this screen:\n${websiteReferenceContext}`;
          }

          // Contextual messages: Vision + Plan + Previous Screens
          // Contextual messages: Vision + Plan + Previous Screens
          const proj = await prisma.project.findUnique({
            where: { id: projectId },
            select: { selectedTheme: true }
          });
          const selectedTheme = proj?.selectedTheme;

          await publish({
            channel: `project:${projectId}`,
            topic: "status",
            data: { 
              message: `Building components for "${screen.title}"...`, 
              status: "generating", 
              currentScreen: screen.title,
              screenId: screenId,
              messageId
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
2. BACKGROUND: You MUST set the body or main container background to the theme's background color (\`var(--background)\`). NEVER leave it default white unless the theme explicitly defines it as white.
3. DETAIL: The code must be extremely detailed. Use strict Tailwind classes for everything.
4. THEME: Ensure the theme is consistent. If previous screens used a specific background gradient, YOU MUST USE IT TOO.
5. CONTENT: Use realistic data. No 'Lorem Ipsum'.
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
            screen: savedScreen,
            messageId: messageId // Include messageId in status update for UI filtering
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
            content: `Conclusion: ${plan.conclusionText}\n\nSuggestion: ${plan.suggestion}`,
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
          markdown: `Conclusion: ${plan.conclusionText}\n\nSuggestion: ${plan.suggestion}`,
          messageId: messageId
        }
      });

      // Final completion signal
      await publish({
        channel: `project:${projectId}`,
        topic: "status",
        data: { 
          message: plan.conclusionText || "Design complete!", 
          status: "complete",
          isSilent,
          messageId: messageId
        }
      });
    }

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
