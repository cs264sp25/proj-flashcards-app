/******************************************************************************
 * HTTP ACTIONS
 *
 * HTTP actions for AI operations:
 * - completion: Handles streaming AI responses for various tasks
 ******************************************************************************/
import { httpAction } from "./_generated/server";

import { prompts } from "./prompts";
import { getCompletion } from "./openai_helpers";
import { MessageType } from "./openai_schema";

const DEBUG = false;

export const completion = httpAction(async (ctx, request) => {
  const body = await request.json();
  const { text, task, context, customPrompt } = body;

  // Unified validation: Check if task exists in prompts
  const taskDefinition = prompts[task];
  if (!taskDefinition) {
    console.error(`ERROR: Invalid or unknown task type received: ${task}`);
    return new Response(JSON.stringify({ error: "Invalid task type" }), {
      status: 400,
    });
  }

  // Validate custom prompt only if task is 'custom'
  if (
    task === "custom" &&
    (typeof customPrompt !== "string" || !customPrompt.trim())
  ) {
    console.error("ERROR: Missing or invalid custom prompt for custom task");
    return new Response(
      JSON.stringify({
        error: "Missing or invalid custom prompt for custom task",
      }),
      { status: 400 },
    );
  }

  if (DEBUG) {
    console.log("DEBUG: completion HTTP action called");
    console.log("DEBUG: ", { text, task, context, customPrompt });
  }

  // Fetch system prompt and user prompt function from the unified taskDefinition
  const systemPrompt = taskDefinition.system;
  const userPromptFunction = taskDefinition.user;

  // Prepare arguments for the user prompt function based on task type
  const userFunctionArgs =
    task === "custom"
      ? { text, prompt: customPrompt, context }
      : { text, context };

  if (DEBUG) {
    console.log("DEBUG: System Prompt:", systemPrompt);
    console.log("DEBUG: User Prompt Function:", userPromptFunction.toString());
    console.log("DEBUG: User Function Arguments:", userFunctionArgs);
  }

  // Create the messages array
  const messages: MessageType[] = [
    { role: "system", content: systemPrompt },
    // Pass appropriate arguments to the user prompt function
    { role: "user", content: userPromptFunction(userFunctionArgs as any) }, // Cast as any to handle different arg shapes
  ];

  if (DEBUG) {
    console.log("DEBUG: messages", messages);
  }

  // Call the OpenAI API
  const result = await getCompletion(messages);

  return result.toDataStreamResponse({
    headers: {
      "Access-Control-Allow-Origin": "*",
      // Ensure other necessary CORS headers if needed
    },
  });
});
