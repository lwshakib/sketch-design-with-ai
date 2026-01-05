import {
  streamText as _streamText,
  convertToModelMessages,
  StreamTextOnFinishCallback,
  UIMessage,
} from "ai";
import { MAXIMUM_OUTPUT_TOKENS } from "@/lib/constants";
import { GeminiModel } from "./model";
import { StreamTextPrompt as SYSTEM_PROMPT } from "./prompts";

export interface StreamTextOptions {
  onFinish?: StreamTextOnFinishCallback<any>;
}

export async function streamText(messages: UIMessage[], options?: StreamTextOptions) {
  const { onFinish } = options || {};

  return _streamText({
    model: GeminiModel(),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    maxOutputTokens: MAXIMUM_OUTPUT_TOKENS,
    onFinish,
    temperature: 1,
  });
}
