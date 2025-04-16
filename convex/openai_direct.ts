/******************************************************************************
 * DIRECT OPENAI IMPLEMENTATION
 *
 * This file implements the completion action using OpenAI's SDK directly,
 * instead of using Vercel's AI SDK.
 ******************************************************************************/

import { ConvexError } from "convex/values";
import { internalAction, ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { chat } from "./prompts";
import OpenAI from "openai";
import { Id } from "./_generated/dataModel";
import { completionArgsSchemaObject } from "./openai_schema";

const DEBUG = true;

// Define the tools using OpenAI's function schema
const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "semanticSearchAmongDecks",
      description:
        "Given a query, return the most relevant decks for this user",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The query to search for relevant decks",
          },
          limit: {
            type: "number",
            description: "The number of decks to return. Defaults to 10.",
          },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "semanticSearchAmongCards",
      description:
        "Given a query, return the most relevant cards for this user",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The query to search for relevant cards",
          },
          limit: {
            type: "number",
            description: "The number of cards to return. Defaults to 10.",
          },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
];

// Helper function to call the appropriate internal action based on the function call
async function handleFunctionCall(
  ctx: ActionCtx,
  tool_call: OpenAI.Chat.Completions.ChatCompletionMessageToolCall,
  args: {
    userId: Id<"users">;
    placeholderMessageId: Id<"messages">;
  },
) {
  if (DEBUG) console.log("[DEBUG] Handling function call:", tool_call.function.name);
  const functionName = tool_call.function.name;
  const functionArgs = JSON.parse(tool_call.function.arguments!);
  if (DEBUG) console.log("[DEBUG] Function arguments:", functionArgs);

  switch (functionName) {
    case "semanticSearchAmongDecks":
      if (DEBUG) console.log("[DEBUG] Executing semantic search among decks");
      return ctx.runAction(internal.decks_internals.semanticSearch, {
        query: functionArgs.query,
        userId: args.userId,
        limit: functionArgs.limit,
      });

    case "semanticSearchAmongCards":
      if (DEBUG) console.log("[DEBUG] Executing semantic search among cards");
      return ctx.runAction(internal.cards_internals.semanticSearch, {
        query: functionArgs.query,
        userId: args.userId,
        limit: functionArgs.limit,
      });

    default:
      if (DEBUG) console.log("[DEBUG] Unknown function called:", functionName);
      throw new ConvexError({
        code: 400,
        message: `Unknown function: ${tool_call.function.name}`,
      });
  }
}

// Function to handle tool calls
async function handleToolCalls(
  ctx: ActionCtx,
  toolCalls: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[],
  args: {
    userId: Id<"users">;
    placeholderMessageId: Id<"messages">;
  },
) {
  if (DEBUG) console.log("[DEBUG] Handling tool calls:", toolCalls.length);
  const results: {
    tool_call_id: string;
    content: any;
  }[] = [];

  for (const toolCall of toolCalls) {
    if (toolCall.type === "function") {
      if (DEBUG) console.log("[DEBUG] Processing function call:", toolCall.id);
      const result = await handleFunctionCall(ctx, toolCall, args);
      results.push({
        tool_call_id: toolCall.id,
        content: result,
      });
    }
  }

  if (DEBUG) console.log("[DEBUG] Tool call results:", results);
  return results;
}

// Main completion action using OpenAI's SDK directly
export const completion = internalAction({
  args: completionArgsSchemaObject,
  handler: async (ctx: ActionCtx, args) => {
    if (DEBUG) console.log("[DEBUG] Starting completion action");
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Add system message
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: chat.system,
      },
      ...args.messages,
    ];
    if (DEBUG) console.log("[DEBUG] Initial messages:", messages);

    let fullResponse = "";
    let finalToolCalls: OpenAI.Chat.Completions.ChatCompletionChunk.Choice.Delta.ToolCall[] =
      [];
    const maxSteps = 5;
    let step = 1;
    while (step <= maxSteps) {
      if (DEBUG) console.log("[DEBUG] Starting step", step, "of", maxSteps);
      step++; // Increment step

      const stream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages:
          messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
        tools: tools as OpenAI.Chat.Completions.ChatCompletionTool[],
        stream: true,
        tool_choice: "auto",
      });

      let message = {} as OpenAI.Chat.Completions.ChatCompletionMessage;

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        if (!delta) continue;

        // Accumulate the message content
        if (delta.content) {
          fullResponse += delta.content;
          if (DEBUG) console.log("[DEBUG] Updated response:", fullResponse);
          await ctx.runMutation(internal.messages_internals.updateMessage, {
            messageId: args.placeholderMessageId,
            content: fullResponse,
          });
        }

        // Handle function calls
        if (delta.tool_calls) {
          if (DEBUG) console.log("[DEBUG] Processing tool calls:", delta.tool_calls);
          for (const toolCall of delta.tool_calls) {
            const { index } = toolCall;

            if (!finalToolCalls[index]) {
              finalToolCalls[index] = toolCall;
            } else {
              // Update the existing tool call
              if (toolCall.id) finalToolCalls[index].id = toolCall.id;
              if (toolCall.type) finalToolCalls[index].type = toolCall.type;
              if (toolCall.function?.name) finalToolCalls[index].function!.name = toolCall.function.name;
              if (toolCall.function?.arguments) {
                finalToolCalls[index].function!.arguments = 
                  (finalToolCalls[index].function!.arguments || '') + toolCall.function.arguments;
              }
            }
            if (DEBUG) console.log("[DEBUG] Updated tool call:", finalToolCalls[index]);
          }
        }
      }

      if (finalToolCalls.length > 0) {
        if (DEBUG) console.log("[DEBUG] Processing final tool calls:", finalToolCalls);
        messages.push({
          role: "assistant",
          content: fullResponse,
          tool_calls:
            finalToolCalls as OpenAI.Chat.Completions.ChatCompletionMessageToolCall[],
        });
        const results = await handleToolCalls(
          ctx,
          finalToolCalls as OpenAI.Chat.Completions.ChatCompletionMessageToolCall[],
          args,
        );
        for (const result of results) {
          messages.push({
            role: "tool",
            content: JSON.stringify(result.content, null, 2),
            tool_call_id: result.tool_call_id,
          });
        }
        if (DEBUG) console.log("[DEBUG] Updated messages after tool calls:", messages);
        // Reset for next iteration
        fullResponse = "";
        finalToolCalls = [];
      } else {
        if (DEBUG) console.log("[DEBUG] No tool calls to process, returning");
        // If we have a complete response and no tool calls, we're done
        if (fullResponse) {
          return;
        }
        // If we have no response and no tool calls, continue to next step
        continue;
      }
    }
    if (DEBUG) console.log("[DEBUG] Reached maximum steps");
  },
});
