import { Type } from "@google/genai";
import { getAndResetCredits } from "@/lib/credits";

export const getUserCreditsTool = {
  name: "getUserCredits",
  description: "Retrieve your remaining design credits. Use this to plan how many screens you can realistically suggest or generate.",
  parameters: {
    type: Type.OBJECT,
    properties: {},
    required: [],
  },
  execute: async (args: any, context: { userId: string; projectId: string }) => {
    try {
      const credits = await getAndResetCredits(context.userId);
      return {
        credits,
        message: `You currently have ${credits} credits left. Generating each screen consumes exactly 1 credit.`,
      };
    } catch (error: any) {
      return { error: `Failed to fetch credits: ${error.message}` };
    }
  },
};
