import {
  streamText as _streamText,
  convertToModelMessages,
  StreamTextOnFinishCallback,
  UIMessage,
} from "ai";
import { MAXIMUM_OUTPUT_TOKENS } from "@/lib/constants";
import { GeminiModel } from "./model";
import { StreamTextPrompt as SYSTEM_PROMPT } from "./prompts";
import { EXAMPLE_REGISTRY } from "./examples/registry";
import fs from "fs";
import path from "path";

function loadExamples(): string {
  let examplesContent = "";
  // Adjust path if necessary based on where this is running from, but process.cwd() is usually project root
  const examplesDir = path.join(process.cwd(), "llm", "examples");

  for (const [title, config] of Object.entries(EXAMPLE_REGISTRY)) {
    try {
      const filePath = path.join(examplesDir, config.file);
      const fileContent = fs.readFileSync(filePath, "utf-8");
      
      examplesContent += `<${config.type} title="${title}">\n${fileContent}\n</${config.type}>\n\n`;
    } catch (error) {
      console.error(`Failed to load example ${title} from ${config.file}:`, error);
    }
  }
  return examplesContent;
}

export interface StreamTextOptions {
  onFinish?: StreamTextOnFinishCallback<any>;
}

export async function streamText(messages: UIMessage[], options?: StreamTextOptions) {
  const { onFinish } = options || {};

  const examples = loadExamples();
  const systemPrompt = SYSTEM_PROMPT.replace("{{EXAMPLES}}", examples);

  return _streamText({
    model: GeminiModel(),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    maxOutputTokens: MAXIMUM_OUTPUT_TOKENS,
    onFinish,
    temperature: 0.7,
  });
}
