import { generateScreenTool } from "./generateScreen";
import { generateThemeTool } from "./generateTheme";
import { getUserCreditsTool } from "./getUserCredits";
import { extractHtmlTool } from "./extractHtml";

export const toolsList = [
  generateScreenTool,
  generateThemeTool,
  getUserCreditsTool,
  extractHtmlTool
];

export const functionDeclarations = toolsList.map(t => ({
  name: t.name,
  description: t.description,
  parameters: t.parameters
}));

export const executeTool = async (
  name: string,
  args: any,
  context: { userId: string; projectId: string },
  onProgress?: (event: any) => void
) => {
  const tool = toolsList.find(t => t.name === name);
  if (!tool) {
    throw new Error(`Tool ${name} not found`);
  }
  return await tool.execute(args, { ...context, onProgress });
};
