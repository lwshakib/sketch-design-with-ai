import {
  streamText as _streamText,
  generateText,
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

import { getDesignInspiration } from "./tools";

export interface StreamTextOptions {
  onFinish?: StreamTextOnFinishCallback<any>;
}

export async function streamText(messages: UIMessage[], options?: StreamTextOptions) {
  const { onFinish } = options || {};

  return await _streamText({
    model: GeminiModel(),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools: {
      getDesignInspiration
    },
    maxOutputTokens: MAXIMUM_OUTPUT_TOKENS,
    onFinish,
    temperature: 0.7,
  });
}
