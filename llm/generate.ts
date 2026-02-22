import {
  generateText as _generateText,
  generateObject as _generateObject,
} from "ai";
import { GeminiModel } from "./model";
import { MAXIMUM_OUTPUT_TOKENS } from "@/lib/constants";
import { z } from "zod";

export interface GenerateTextOptions {
  system?: string;
  messages: any[];
  temperature?: number;
  maxOutputTokens?: number;
  tools?: Record<string, any>;
  stopWhen?: any;
}

export interface GenerateObjectOptions {
  system?: string;
  messages: any[];
  schema: z.ZodType<any>;
  temperature?: number;
}

/**
 * Reusable AI text generation utility powered by Gemini and Vercel AI SDK.
 * Handles model rotation, token limits, and standardized configuration.
 */
export async function generateText({
  system,
  messages,
  temperature = 0.7,
  maxOutputTokens = MAXIMUM_OUTPUT_TOKENS,
  tools,
  stopWhen,
}: GenerateTextOptions) {
  return await _generateText({
    model: GeminiModel(),
    system,
    messages,
    temperature,
    maxOutputTokens,
    tools,
    stopWhen,
  });
}

/**
 * Reusable AI object generation utility.
 */
export async function generateObject({
  system,
  messages,
  schema,
  temperature = 0.7,
}: GenerateObjectOptions) {
  return await _generateObject({
    model: GeminiModel(),
    system,
    messages,
    schema,
    temperature,
  });
}
