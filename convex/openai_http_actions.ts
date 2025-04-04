import { v } from "convex/values";
import { httpAction } from "./_generated/server";
import { prompts } from "./prompts";
import { getCompletion } from "./openai_helpers";
import { MessageType } from "./openai_schema";

const DEBUG = true;

// Updated task schema to include 'custom' directly
const taskSchema = v.union(
  v.literal("grammar"),
  v.literal("improve"),
  v.literal("simplify"),
  v.literal("shorten"),
  v.literal("lengthen"),
  v.literal("frontToQuestion"),
  v.literal("questionImprove"),
  v.literal("answerConcise"),
  v.literal("answerComprehensive"),
  v.literal("answerStructure"),
  v.literal("custom"),
);

export const completion = httpAction(async (ctx, request) => {
  // Updated body structure expectation
  const body = await request.json();
  // Example validation (adjust based on actual hook implementation)
  // Assuming the hook sends { text: string, task: string, context?: any, customPrompt?: string }
  const { text, task, context, customPrompt } = body;

  // Validate task type: Check if it's 'custom' or exists in prompts
  if (task !== "custom" && !prompts[task]) {
    console.error(`ERROR: Invalid task type received: ${task}`);
    return new Response(JSON.stringify({ error: "Invalid task type" }), {
      status: 400,
    });
  }

  // Validate custom prompt if task is 'custom'
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

  let systemPrompt = "You are a helpful AI assistant."; // Default system prompt
  let userPromptFunction: (input: { text: string; context?: any }) => string;

  if (task === "custom") {
    // Use a default system prompt for custom tasks or allow override if needed
    // User prompt is directly the custom prompt provided
    // We assume the custom prompt *is* the instruction and operates on the input text.
    // The {text} placeholder is removed based on user request.
    // The context might need explicit instructions in the custom prompt if needed.
    userPromptFunction = (input) =>
      `${customPrompt}\n\nText to modify:\n${input.text}`;
    // Optionally, a more specific system prompt could be set for custom tasks
    // systemPrompt = "You are an AI assistant executing a custom user instruction.";
  } else {
    // Predefined tasks
    const taskDefinition = prompts[task];
    if (!taskDefinition) {
      // This should ideally not happen due to prior validation
      console.error(`ERROR: No prompt definition found for task: ${task}`);
      return new Response(
        JSON.stringify({
          error: "Internal server error: Missing prompt definition",
        }),
        { status: 500 },
      );
    }
    systemPrompt = taskDefinition.system;
    userPromptFunction = taskDefinition.user;
  }

  if (DEBUG) {
    console.log("DEBUG: System Prompt:", systemPrompt);
    console.log("DEBUG: User Prompt Function:", userPromptFunction.toString());
  }

  // Create the messages array
  const messages: MessageType[] = [
    { role: "system", content: systemPrompt },
    // Pass text and context to the user prompt function
    { role: "user", content: userPromptFunction({ text, context }) },
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
