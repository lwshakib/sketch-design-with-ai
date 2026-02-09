import { z } from "zod";
import { EXAMPLE_REGISTRY } from "./examples/registry";
import fs from "fs";
import path from "path";

export const getDesignInspiration = {
  description: "Get high-fidelity design examples (HTML/Tailwind) for inspiration based on the platform type (web or app) and optional keywords.",
  parameters: z.object({
    type: z.enum(["web", "app"]).describe("The platform type to get inspiration for."),
    query: z.string().optional().describe("Keywords to search for in example titles (e.g., 'dashboard', 'settings', 'profile')."),
  }),
  execute: async ({ type, query }: { type: 'web' | 'app'; query?: string }) => {
    const examplesDir = path.join(process.cwd(), "llm", "examples");
    
    // Filter examples by type
    let filteredExamples = Object.entries(EXAMPLE_REGISTRY)
      .filter(([_, config]) => (config as any).type === type);

    // If query is provided, filter or sort by relevance
    if (query) {
      const keywords = query.toLowerCase().split(/\s+/);
      filteredExamples = filteredExamples.filter(([title]) => {
        const titleLower = title.toLowerCase();
        return keywords.some(kw => titleLower.includes(kw));
      });
      
      // If no matches with query, fall back to type-only
      if (filteredExamples.length === 0) {
        filteredExamples = Object.entries(EXAMPLE_REGISTRY)
          .filter(([_, config]) => (config as any).type === type);
      }
    }

    // Take up to 3 examples
    const selectedExamples = filteredExamples.slice(0, 3);
    let examplesContent = "";

    for (const [title, config] of selectedExamples) {
      try {
        const filePath = path.join(examplesDir, (config as any).file);
        const fileContent = fs.readFileSync(filePath, "utf-8");
        examplesContent += `<example title="${title}" type="${type}">\n${fileContent}\n</example>\n\n`;
      } catch (error) {
        console.error(`Failed to load example ${title} from ${(config as any).file}:`, error);
      }
    }

    return examplesContent || "No examples found for this type/query.";
  },
} as any;
