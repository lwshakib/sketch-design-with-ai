import { GLM_WORKER_URL, CLOUDFLARE_API_KEY } from "@/lib/env";
import { GLMMessage, GLMTool } from "./generate-text";

/**
 * Low-level text generation stream to GLM-4.7-Flash.
 */
export async function streamText({
  messages = [],
  tools = {},
  temperature = 0.7,
  maxOutputTokens,
}: {
  messages?: GLMMessage[];
  tools?: Record<string, GLMTool>;
  temperature?: number;
  maxOutputTokens?: number;
}) {
  const allMessages: GLMMessage[] = [...messages];

  // Convert tools to GLM format
  const glmTools = Object.entries(tools).map(([name, tool]) => ({
    type: "function",
    function: {
      name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));

  const response = await fetch(GLM_WORKER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CLOUDFLARE_API_KEY}`,
    },
    body: JSON.stringify({
      messages: allMessages,
      tools: glmTools.length > 0 ? glmTools : undefined,
      temperature,
      max_tokens: maxOutputTokens,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GLM Worker Error: ${response.status} - ${errorText}`);
  }

  return response.body;
}
