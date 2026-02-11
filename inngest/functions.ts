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
import { getAllExamples } from "../llm/tools";
import prisma from "../lib/prisma";
import { MAXIMUM_OUTPUT_TOKENS } from "../lib/constants";
import { extractArtifacts } from "../lib/artifact-renderer";

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
    const { messages, projectId } = event.data;
    
    // Normalize messages to always be an array with at least one message
    let safeMessages = Array.isArray(messages) ? messages : [];
    
    // Debug logging
    console.log('[generateDesign] Received messages:', JSON.stringify(safeMessages, null, 2));
    
    // If no messages, create a fallback
    if (safeMessages.length === 0) {
      console.warn('[generateDesign] No messages received, using fallback');
      safeMessages = [{ role: 'user', content: 'Create a modern design' }];
    }

    // --- STEP 1 & 2: VISION & PLANNING ---
    await publish({
      channel: `project:${projectId}`,
      topic: "status",
      data: { message: "Synthesizing design vision...", status: "vision" }
    });

    const { plan, vision, conclusionText, suggestion } = await step.run("generate-design-manifest", async () => {
      // Normalize messages
      let stepMessages = Array.isArray(messages) ? messages : [];
      if (stepMessages.length === 0) {
        stepMessages = [{ role: 'user', content: 'Create a modern design' }];
      }
      
      const inspiration = getAllExamples();




      const { object } = await generateObject({
        system: PlanningPrompt + `\n\nUse these high-fidelity design examples as your primary inspiration for quality and code structure:\n${inspiration}`,
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
          conclusionText: z.string().describe("A short sentence confirm that all requested screens have been generated successfully."),
          suggestion: z.string().describe("A single brief suggestion for the next potential design step (e.g., 'Design a community leaderboard screen').")
        })
      });

      const planJson = { 
        screens: object.screens, 
        themes: object.themes,
        conclusionText: object.conclusionText,
        suggestion: object.suggestion
      };
      
      // Update Project with themes
      if (object.themes && object.themes.length > 0) {
        await prisma.project.update({
          where: { id: projectId },
          data: { themes: object.themes }
        });
      }

      // Stream the plan and vision to the UI
      await publish({
        channel: `project:${projectId}`,
        topic: "status",
        data: { message: object.vision, status: "vision" }
      });

      await publish({
        channel: `project:${projectId}`,
        topic: "plan",
        data: { 
          plan: planJson, 
          markdown: `Vision: ${object.vision}\n\nConclusion: ${object.conclusionText}\n\nSuggestion: ${object.suggestion}` 
        }
      });

      return { 
        plan: planJson, 
        vision: object.vision,
        conclusionText: object.conclusionText,
        suggestion: object.suggestion
      };
    });

    // Save vision message to database
    const messageId = await step.run("save-vision-message", async () => {
      const msg = await prisma.message.create({
        data: {
          projectId: projectId,
          role: "assistant",
          content: vision,
          plan: JSON.parse(JSON.stringify(plan))
        },
      });
      return msg.id;
    });

    await publish({
      channel: `project:${projectId}`,
      topic: "status",
      data: { message: "Architecting project manifest...", status: "planning" }
    });

    // Update previously created assistant message with plan JSON
    await step.run("update-message-with-plan", async () => {
      await prisma.message.update({
        where: { id: messageId },
        data: {
          plan: JSON.parse(JSON.stringify(plan))
        },
      });
    });

    // Create placeholder screens in DB so they appear on UI immediately
    await step.run("init-placeholder-screens", async () => {
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

      for (const screen of plan.screens) {
         const width = screen.type === 'app' ? 380 : screen.type === 'web' ? 1024 : 800;
         
         // If there was a previous screen (or loop iteration), add spacing
         // Actually, the initial currentX is set.
         // But we need to increment it for subsequent screens in the loop.
         
         await prisma.screen.create({
           data: {
             projectId: projectId,
             title: screen.title,
             content: "", // Empty content = placeholder
             type: screen.type,
             x: currentX,
             y: 0,
             width: width,
             height: 800
           }
         });

         // Increment X for next screen
         currentX += width + 120;
      }
    });

    // 3. Sequentially generate each screen in the plan
    if (plan.screens.length > 0) {
      let screensContext: { title: string; content: string }[] = [];
      for (let i = 0; i < plan.screens.length; i++) {
        const screen = plan.screens[i];
        if (!screen) continue;
        
        // Notify UI: starting screen
        await publish({
          channel: `project:${projectId}`,
          topic: "status",
          data: { 
            message: `Designing "${screen.title}"...`, 
            status: "generating", 
            currentScreen: screen.title 
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
              currentScreen: screen.title 
            }
          });
          
          // Fetch relevant inspiration
          const inspiration = getAllExamples();
          
          // Contextual messages: Vision + Plan + Previous Screens
          const themes = (plan as any).themes || [];
          const selectedTheme = themes.length > 0 ? themes[0] : null;

          await publish({
            channel: `project:${projectId}`,
            topic: "status",
            data: { 
              message: `Building components for "${screen.title}"...`, 
              status: "generating", 
              currentScreen: screen.title 
            }
          });

          const contextMessages = [
             { role: 'assistant', content: vision || '' },
             { role: 'assistant', content: `Design Plan: ${JSON.stringify({ screens: plan.screens })}` }, // Pass FULL plan for context
             ...screensContext.map(s => ({
                role: 'assistant',
                content: `Earlier, I generated the "${s.title}" screen. Here is its code:\n\n${s.content}`
             }))
          ];

          const { text } = await generateText({
            system: ScreenGenerationPrompt + "\n\nCRITICAL: You are generating a highly detailed, production-ready screen. Do not use placeholders. Ensure all content is realistic and high-fidelity.",
            messages: [
              ...safeMessages,
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
4. CONTENT: Use realistic data. No 'Lorem Ipsum'.` }
            ] as any,
            stopWhen: stepCountIs(5) as any,
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

          return {
            title: artifact.title || screen.title,
            content: artifact.content,
            type
          };
        });
        
        // Add to context for next iteration
        screensContext.push({
           title: generatedScreen.title,
           content: generatedScreen.content
        });

        // Save the screen to database and notify UI
        const savedScreen = await step.run(`save-screen-${i}-db`, async () => {
          const existingScreen = await prisma.screen.findFirst({
            where: {
              projectId: projectId,
              title: generatedScreen.title
            }
          });

          if (existingScreen) {
             return await prisma.screen.update({
               where: { id: existingScreen.id },
               data: {
                 content: generatedScreen.content,
                 type: generatedScreen.type,
                 updatedAt: new Date()
               }
             });
          } else {
             const lastScreen = await prisma.screen.findFirst({
               where: { projectId: projectId },
               orderBy: { x: 'desc' }
             });

             const getWidth = (t: string) => t === 'app' ? 380 : t === 'web' ? 1024 : 800;
             const currentWidth = getWidth(generatedScreen.type);
             const newX = lastScreen 
               ? lastScreen.x + (lastScreen.width || getWidth(lastScreen.type)) + 120 
               : -(currentWidth / 2);

             return await prisma.screen.create({
               data: {
                 projectId: projectId,
                 title: generatedScreen.title,
                 content: generatedScreen.content,
                 type: generatedScreen.type,
                 x: newX, y: 0,
                 width: currentWidth, height: 800 
               }
             });
          }
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

      // Final completion signal
      const finalMessage = plan.conclusionText || "";
      await publish({
        channel: `project:${projectId}`,
        topic: "status",
        data: { 
          message: finalMessage, 
          status: "complete" 
        }
      });
    }

    return { success: true };
  }
);


