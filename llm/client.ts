import { GoogleGenAI } from "@google/genai";
import * as env from "@/lib/env";

export const ai = new GoogleGenAI({
  apiKey: env.GEMINI_API_KEY || "DUMMY_KEY",
});
export default ai;
