import { GoogleGenAI } from "@google/genai";
import * as env from "@/lib/env";

export const ai = new GoogleGenAI({
  apiKey: env.CLOUDFLARE_AI_GATEWAY_API_KEY || process.env.GEMINI_API_KEY || "DUMMY_KEY",
  ...(env.CLOUDFLARE_AI_GATEWAY_ENDPOINT && { baseURL: env.CLOUDFLARE_AI_GATEWAY_ENDPOINT }),
});
export default ai;
