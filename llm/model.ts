import { createGoogleGenerativeAI } from "@ai-sdk/google";

let keyIndex = 0;
let modelIndex = 0;

const MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite"
];

export const getSingleAPIKey = () => {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY is not set");
  }
  const keys = apiKey.split(",");
  const selectedKey = keys[keyIndex % keys.length];
  // Increment index for next call
  keyIndex = (keyIndex + 1) % keys.length;
  return selectedKey;
};

export const getSingleModel = () => {
  const selectedModel = MODELS[modelIndex % MODELS.length];
  // Increment index for next call
  modelIndex = (modelIndex + 1) % MODELS.length;
  return selectedModel;
};

export const GeminiModel = () => {
  const model = getSingleModel();
  const apiKey = getSingleAPIKey();
  
  console.log(`[AI] Using model: ${model} (Index: ${modelIndex})`);

  const google = createGoogleGenerativeAI({
    apiKey: apiKey,
  });
  
  return google(model); 
};
