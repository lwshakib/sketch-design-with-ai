import { ai } from "./client";
import { CHAT_MODEL_ID } from "./constants";
import { processMessages } from "./utils";

export async function generateText(
  messages: any[],
  options?: { temperature?: number; max_tokens?: number; projectId?: string }
): Promise<{ text: string }> {
  const { temperature } = options || {};

  // Preprocess messages
  const processed = await processMessages(messages);

  // Extract system instruction if present
  let systemInstruction: string | undefined;
  const filteredContents = processed.filter((msg) => {
    if (msg.role === "system") {
      systemInstruction = msg.parts[0]?.text;
      return false;
    }
    return true;
  });

  const response = await ai.models.generateContent({
    model: CHAT_MODEL_ID,
    contents: filteredContents,
    config: {
      temperature,
      // Omit maxOutputTokens to rely on context window safety
      ...(systemInstruction && { systemInstruction }),
    },
  });

  return { text: response.text || "" };
}
export default generateText;
