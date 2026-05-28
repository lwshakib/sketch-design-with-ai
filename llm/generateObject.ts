import { ai } from "./client";
import { CHAT_MODEL_ID } from "./constants";
import { processMessages } from "./utils";

export async function generateObject<T>(
  messages: any[],
  options?: { projectId?: string },
): Promise<T> {
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
      responseMimeType: "application/json",
      ...(systemInstruction && { systemInstruction }),
    },
  });

  const content = response.text;
  if (!content) {
    throw new Error(`Failed to generate object: No content in response.`);
  }

  try {
    return JSON.parse(content) as T;
  } catch (e) {
    console.error("[generateObject] JSON Parse Error. Content:", content);
    throw new Error(`Model returned invalid JSON: ${content.slice(0, 100)}...`);
  }
}
export default generateObject;
