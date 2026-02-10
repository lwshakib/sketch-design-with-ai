import { inngest } from "./client";
import { generateText, stepCountIs } from "ai";
import { z } from "zod";
import { GeminiModel } from "../llm/model";
import { 
  InitialResponsePrompt, 
  PlanningPrompt, 
  ScreenGenerationPrompt,
} from "../llm/prompts";
import { getDesignInspiration } from "../llm/tools";
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

    // --- STEP 1: VISION RESPONSE ---
    const vision = await step.run("generate-vision", async () => {
      // Normalize messages inside step to avoid Inngest closure issues
      let stepMessages = Array.isArray(messages) ? messages : [];
      if (stepMessages.length === 0) {
        stepMessages = [{ role: 'user', content: 'Create a modern design' }];
      }
      
      const lastUserMessage = [...stepMessages].reverse().find(m => m.role === 'user')?.content || '';
      const isMobileRequest = lastUserMessage.toLowerCase().match(/mobile|app|phone|ios|android/);
      const searchType = isMobileRequest ? 'app' : 'web';
      
      // Fetch inspiration for the overall vision
      const inspiration = await getDesignInspiration.execute({
        type: searchType,
        query: lastUserMessage
      });

      console.log('[generate-vision] Processing messages:', JSON.stringify(stepMessages));
      
      const { text } = await generateText({
        model: GeminiModel(),
        system: InitialResponsePrompt + `\n\nUse this inspiration to guide your vision:\n${inspiration}`,
        messages: stepMessages,
        tools: {
          getDesignInspiration
        },
        stopWhen: stepCountIs(5),
        toolChoice: 'auto'
      });

      // Stream vision response to UI via Realtime
      await publish({
        channel: `project:${projectId}`,
        topic: "status",
        data: { message: text, status: "vision" }
      });

      return text;
    });

    // --- STEP 2: PLANNING ---
    await publish({
      channel: `project:${projectId}`,
      topic: "status",
      data: { message: "Architecting project manifest...", status: "planning" }
    });

    // 2. Generate detailed architectural plan
    const { plan, planMarkdown } = await step.run("generate-plan", async () => {
      const { text } = await generateText({
        model: GeminiModel(),
        system: PlanningPrompt,
        messages: [
          ...safeMessages,
          { role: 'assistant', content: vision }
        ],
        maxOutputTokens: MAXIMUM_OUTPUT_TOKENS,
        temperature: 0.7,
      });

      // Simple extraction of JSON within <plan> tags
      const planMatch = text.match(/<plan>([\s\S]*?)<\/plan>/i);
      let planJson: Plan = { screens: [] };
      
      if (planMatch) {
         try {
           planJson = JSON.parse(planMatch[1].trim());
         } catch (e) {
           console.error("Failed to parse plan JSON", e);
         }
      }

      const markdown = text.replace(/<plan>([\s\S]*?)<\/plan>/i, "").trim();

      // Stream the plan and markdown to the UI via Realtime
      await publish({
        channel: `project:${projectId}`,
        topic: "plan",
        data: { plan: planJson, markdown }
      });

      return { plan: planJson, planMarkdown: markdown };
    });

    // Save as assistant message with vision, plan markdown, and the JSON plan
    await step.run("save-assistant-message", async () => {
      await prisma.message.create({
        data: {
          projectId: projectId,
          role: "assistant",
          content: vision + "\n\n" + planMarkdown,
          plan: JSON.parse(JSON.stringify(plan))
        },
      });
    });

    // 3. Sequentially generate each screen in the plan
    if (plan.screens.length > 0) {
      for (let i = 0; i < plan.screens.length; i++) {
        const screen = plan.screens[i];
        if (!screen) continue;
        
        // Notify UI: starting screen
        await publish({
          channel: `project:${projectId}`,
          topic: "status",
          data: { 
            message: `Architecting "${screen.title}"...`, 
            status: "generating", 
            currentScreen: screen.title 
          }
        });

        const generatedScreen = await step.run(`generate-screen-${i}`, async () => {
          // Fetch relevant inspiration based on screen title and description
          const inspiration = await getDesignInspiration.execute({
            type: screen.type,
            query: `${screen.title} ${screen.description}`
          });

          const { text } = await generateText({
            model: GeminiModel(),
            system: ScreenGenerationPrompt,
            messages: [
              ...safeMessages,
              { role: 'assistant', content: vision || '' },
              { role: 'assistant', content: `Design Plan: ${JSON.stringify({ screens: [screen] })}` },
              { role: 'user', content: `Here is some high-fidelity design inspiration for this screen:\n\n${inspiration}` },
              { role: 'user', content: `Now generate the ${screen.title} (${screen.type}) screen based on the vision and the inspiration provided above. Description: ${screen.description}. SPECIFIC PROMPT: ${(screen as any).prompt || ''}` }
            ],
            tools: {
              getDesignInspiration
            },
            stopWhen: stepCountIs(5),
            toolChoice: 'auto',
            maxOutputTokens: MAXIMUM_OUTPUT_TOKENS,
            temperature: 0.7,
          });

          const artifacts = extractArtifacts(text);
          const artifact = artifacts[0] || { 
            title: screen.title, 
            content: text, 
            type: screen.type 
          };

          let type = artifact.type as string;
          if (type === 'app' || type === 'general' || !type) {
            type = screen.type;
          }

          return {
            title: artifact.title || screen.title,
            content: artifact.content,
            type: type as 'web' | 'app'
          };
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
      await publish({
        channel: `project:${projectId}`,
        topic: "status",
        data: { 
          message: "All screens architected successfully!", 
          status: "complete" 
        }
      });
    }

    return { success: true };
  }
);


