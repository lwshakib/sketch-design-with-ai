import { EXAMPLE_REGISTRY } from "./examples/registry";
import fs from "fs";
import path from "path";

export function getAllExamples(): string {
  const examplesDir = path.join(process.cwd(), "llm", "examples");
  let examplesContent = "";
  
  for (const [title, config] of Object.entries(EXAMPLE_REGISTRY)) {
    try {
      const filePath = path.join(examplesDir, (config as any).file);
      if (fs.existsSync(filePath)) {
         const fileContent = fs.readFileSync(filePath, "utf-8");
         examplesContent += `<example title="${title}" type="${(config as any).type}">\n${fileContent}\n</example>\n\n`;
      }
    } catch (error) {
      console.error(`Failed to load example ${title}:`, error);
    }
  }

  return examplesContent;
}
