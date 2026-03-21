import { GLM_WORKER_URL, CLOUDFLARE_API_KEY } from "@/lib/env";

// Internal types for GLM messages
export type GLMMessage = {
  role: string;
  content: string | null;
  tool_calls?: any[];
  tool_call_id?: string;
  name?: string;
};

export interface GLMTool {
  description: string;
  parameters: Record<string, any>;
  execute: (args: any) => Promise<any>;
}

/**
 * Low-level text generation call to GLM-4.7-Flash.
 */
async function callGLM(options: {
  messages: GLMMessage[];
  tools?: any[];
  temperature?: number;
  max_tokens?: number;
}) {
  const response = await fetch(GLM_WORKER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CLOUDFLARE_API_KEY}`,
    },
    body: JSON.stringify({
      ...options,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GLM Worker Error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

/**
 * High-level generateText function for tools and multi-step execution.
 * Powered by GLM-4.7-Flash with manual tool execution loop.
 */
export async function generateText({
  messages = [],
  tools = {},
  temperature = 0.7,
  maxOutputTokens,
  maxSteps = 5,
}: {
  messages?: GLMMessage[];
  tools?: Record<string, GLMTool>;
  temperature?: number;
  maxOutputTokens?: number;
  maxSteps?: number;
}) {
  const allMessages: GLMMessage[] = [...messages];

  // Convert AI SDK style tools to GLM format
  const glmTools = Object.entries(tools).map(([name, tool]) => ({
    type: "function",
    function: {
      name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));

  // Tool execution loop
  let currentStep = 0;

  while (currentStep < maxSteps) {
    console.log(
      `[GLM generateText] Step ${currentStep + 1}/${maxSteps} - ${allMessages.length} messages, ${glmTools.length} tools.`,
    );

    const result = await callGLM({
      messages: allMessages,
      tools: glmTools.length > 0 ? glmTools : undefined,
      temperature,
      max_tokens: maxOutputTokens,
    });

    const assistantMessage = result.choices?.[0]?.message;
    if (!assistantMessage) throw new Error("GLM returned empty response");

    // Add model's answer to history
    allMessages.push(assistantMessage);

    const toolCalls = assistantMessage.tool_calls;
    if (!toolCalls || toolCalls.length === 0) {
      // Model finished without tool calls, or final text after tool calls
      return { text: assistantMessage.content || "" };
    }

    // Execute tool calls sequentially
    console.log(
      `[GLM generateText] Model requested ${toolCalls.length} tool calls.`,
    );

    for (const toolCall of toolCalls) {
      const toolName = toolCall.function.name;
      const tool = tools[toolName];

      if (!tool) {
        console.warn(
          `[GLM generateText] Warning: Called unknown tool: ${toolName}`,
        );
        allMessages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          name: toolName,
          content: `Error: Tool ${toolName} not found.`,
        });
        continue;
      }

      try {
        console.log(`[GLM generateText] Running tool: ${toolName}...`);
        const args = JSON.parse(toolCall.function.arguments);
        const output = await tool.execute(args);

        allMessages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          name: toolName,
          content: typeof output === "string" ? output : JSON.stringify(output),
        });
      } catch (err: any) {
        console.error(`[GLM generateText] Tool ${toolName} execution error:`, err);
        allMessages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          name: toolName,
          content: `Error: ${err.message}`,
        });
      }
    }

    currentStep++;
  }

  console.warn(
    `[GLM generateText] Hit maxSteps (${maxSteps}). Returning last valid text content.`,
  );

  // Return the last found content from all assistant messages
  let finalText = "";
  for (let i = allMessages.length - 1; i >= 0; i--) {
    if (allMessages[i].role === "assistant" && allMessages[i].content) {
      finalText = allMessages[i].content!;
      break;
    }
  }

  return { text: finalText };
}
