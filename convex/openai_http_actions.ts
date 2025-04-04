import { v } from "convex/values";
import { action, httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { prompts } from "./prompts";
import { getCompletion } from "./openai_helpers";
import { MessageType } from "./openai_schema";

const DEBUG = true;

// Define the task schema
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

// Define the input schema
const inputSchema = v.object({
  text: v.string(),
  context: v.optional(v.any()),
});

export const completion = httpAction(async (ctx, request) => {
  const body = await request.json();
  const { prompt, task, customPrompt, systemPrompt } = body;

  if (DEBUG) {
    console.log("DEBUG: completion HTTP action called");
    console.log("DEBUG: ", {
      prompt,
      task,
      customPrompt,
      systemPrompt,
    });
  }

  // Get the appropriate prompt based on the task
  const taskPrompt =
    typeof task === "string"
      ? prompts[task]
      : {
          system: systemPrompt || "",
          user: (input: { text: string; context?: any }) =>
            customPrompt?.replace("{text}", input.text) || "",
        };

  if (DEBUG) {
    console.log("DEBUG: taskPrompt", taskPrompt);
  }

  // Create the messages array
  const messages: MessageType[] = [
    { role: "system", content: taskPrompt.system },
    { role: "user", content: taskPrompt.user(prompt) },
  ];

  if (DEBUG) {
    console.log("DEBUG: messages", messages);
  }

  // Call the OpenAI API
  const result = await getCompletion(messages);

  return result.toDataStreamResponse({
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  });

});
