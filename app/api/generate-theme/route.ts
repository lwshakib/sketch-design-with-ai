import { generateObject } from "ai";
import { z } from "zod";
import { GeminiModel } from "@/llm/model";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return new Response("Prompt is required", { status: 400 });
    }

    const { object } = await generateObject({
      model: GeminiModel(),
      schema: z.object({
        name: z.string().describe("A short creative name for the theme"),
        description: z
          .string()
          .describe("A 1-sentence description of the design rationale"),
        cssVars: z.object({
          background: z.string().describe("hex color"),
          foreground: z.string().describe("hex color"),
          card: z.string().describe("hex color"),
          cardForeground: z.string().describe("hex color"),
          popover: z.string().describe("hex color"),
          popoverForeground: z.string().describe("hex color"),
          primary: z.string().describe("hex color"),
          primaryForeground: z.string().describe("hex color"),
          secondary: z.string().describe("hex color"),
          secondaryForeground: z.string().describe("hex color"),
          muted: z.string().describe("hex color"),
          mutedForeground: z.string().describe("hex color"),
          accent: z.string().describe("hex color"),
          accentForeground: z.string().describe("hex color"),
          destructive: z.string().describe("hex color"),
          border: z.string().describe("hex color"),
          input: z.string().describe("hex color"),
          ring: z.string().describe("hex color"),
          radius: z
            .string()
            .describe("CSS radius value (e.g. 0.5rem, 1rem, 0rem)"),
          fontSans: z
            .string()
            .describe(
              "One of these font stacks: 'Inter', 'sans-serif' OR 'Outfit', 'sans-serif' OR 'Plus Jakarta Sans', 'sans-serif' OR 'JetBrains Mono', 'monospace'",
            ),
        }),
      }),
      system: `You are a high-end UI/UX Design tokens generator. 
      Your goal is to generate a comprehensive set of CSS variables (design tokens) for a professional application based on a user's prompt (mood, brand identity, or industry).

      CRITICAL:
      1. Colors must be sophisticated and high-contrast for accessibility.
      2. Ensure a modern, premium look.
      3. For typography, choose the one that best fits the brand mood.
      4. Avoid plain basic colors; use curated, deep, and vibrant tones.`,
      prompt: `Generate a theme for: ${prompt}`,
    });

    return Response.json(object);
  } catch (error) {
    console.error("Theme generation error:", error);
    return new Response("Failed to generate theme", { status: 500 });
  }
}
