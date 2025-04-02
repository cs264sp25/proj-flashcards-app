import { Infer, v } from "convex/values";
import { action, ActionCtx, httpAction } from "./_generated/server";
import { getCompletion } from "./openai_helpers";
import { MessageType } from "./openai_schema";
import { ToolSet } from "ai";
import { improve } from "./prompts";

const DEBUG = true;

const taskSchema = v.union(
  v.literal("grammar"),
  v.literal("improve"),
  v.literal("shorten"),
  v.literal("lengthen"),
  v.literal("simplify"),
  v.literal("professional"),
);

export type Task = Infer<typeof taskSchema>;

export const TaskDescriptions: Record<Task, string> = {
  grammar: "Fix spelling & grammar",
  improve: "Improve writing",
  shorten: "Make shorter",
  lengthen: "Make longer",
  simplify: "Simplify language",
  professional: "Change to professional tone",
};

export const completion = httpAction(
  async (ctx: ActionCtx, request: Request): Promise<Response> => {
    if (DEBUG) {
      console.log("DEBUG: completion");
    }


    const body = await request.json();

    console.log("DEBUG: body", body);
    const { prompt: input, task } = body;

    const messages: MessageType[] = [
      {
        role: "system",
        content: improve.system,
      },
      { role: "user", content: improve.user(input) },
    ];

    const result = await getCompletion(messages);

    return result.toDataStreamResponse({
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  },
);
