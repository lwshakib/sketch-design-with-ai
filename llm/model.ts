import { createGoogleGenerativeAI } from "@ai-sdk/google";

let requestCount = 0;

const MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];

export const GeminiModel = () => {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY is not set");
  }

  const keys = apiKey.split(",");
  const currentKeyIndex = requestCount % keys.length;
  const currentModelIndex = requestCount % MODELS.length;

  const selectedKey = keys[currentKeyIndex];
  const selectedModel = MODELS[currentModelIndex];

  // Increment global counter for the NEXT call (rotation)
  requestCount++;

  console.log(
    `[AI] Requesting: ${selectedModel} (Key Index: ${currentKeyIndex}, Model Index: ${currentModelIndex})`,
  );

  const google = createGoogleGenerativeAI({
    apiKey: selectedKey,
  });

  return google(selectedModel);
};
