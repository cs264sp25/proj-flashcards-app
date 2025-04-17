/******************************************************************************
 * HTTP Handler with OpenAI SDK
 *
 * This file implements the completion action using OpenAI's SDK directly,
 * instead of using Vercel's AI SDK.
 ******************************************************************************/

import { ConvexError } from "convex/values";
import { ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { chat } from "./prompts";
import OpenAI from "openai";
import { Id } from "./_generated/dataModel";
import { Hono } from "hono";
import { HonoWithConvex } from "convex-helpers/server/hono";
import { z } from "zod";
import { streamSSE } from "hono/streaming";

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

// Create a new Hono route
export const directCompletionRoute: HonoWithConvex<ActionCtx> = new Hono();

// Define the request schema
const completionRequestSchema = z.object({
  messageId: z.string(),
});

directCompletionRoute.post("/direct-completion", async (c) => {
  try {
    const ctx: ActionCtx = c.env;
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return c.json({ error: "Missing or invalid authorization token" }, 401);
    }

    // Validate request body
    const rawRequestBody = await c.req.json();
    const validationResult = completionRequestSchema.safeParse(rawRequestBody);

    if (!validationResult.success) {
      return c.json(
        {
          error: "Invalid request body",
          details: validationResult.error.flatten(),
        },
        400,
      );
    }

    const { messageId } = validationResult.data;

    // Get the message and its chat history
    const message = await ctx.runQuery(internal.messages_internals.getMessageById, {
      messageId: messageId as Id<"messages">,
    });

    if (!message) {
      return c.json({ error: "Message not found" }, 404);
    }

    // Get chat history
    const paginatedMessages = await ctx.runQuery(
      internal.messages_internals.getAllMessages,
      {
        paginationOpts: {
          numItems: 10,
          cursor: null,
        },
        chatId: message.chatId,
        sortOrder: "desc",
      },
    );

    const { page: messages } = paginatedMessages;
    messages.reverse();

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Add system message
    const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: chat.system,
      },
      ...messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    if (DEBUG) console.log("[DEBUG] Initial messages:", openaiMessages);

    return streamSSE(c, async (stream) => {
      let finalToolCalls: OpenAI.Chat.Completions.ChatCompletionChunk.Choice.Delta.ToolCall[] = [];
      const maxSteps = 5;
      let step = 1;

      while (step <= maxSteps) {
        if (DEBUG) console.log("[DEBUG] Starting step", step, "of", maxSteps);
        step++;

        const openaiStream = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: openaiMessages,
          tools: tools,
          stream: true,
          tool_choice: "auto",
        });

        for await (const chunk of openaiStream) {
          const delta = chunk.choices[0]?.delta;
          if (!delta) continue;

          // Handle content
          if (delta.content) {
            await stream.writeSSE({
              data: delta.content,
            });
          }

          // Handle function calls
          if (delta.tool_calls) {
            for (const toolCall of delta.tool_calls) {
              const { index } = toolCall;

              if (!finalToolCalls[index]) {
                finalToolCalls[index] = toolCall;
              } else {
                if (toolCall.id) finalToolCalls[index].id = toolCall.id;
                if (toolCall.type) finalToolCalls[index].type = toolCall.type;
                if (toolCall.function?.name) finalToolCalls[index].function!.name = toolCall.function.name;
                if (toolCall.function?.arguments) {
                  finalToolCalls[index].function!.arguments = 
                    (finalToolCalls[index].function!.arguments || '') + toolCall.function.arguments;
                }
              }
            }
          }
        }

        if (finalToolCalls.length > 0) {
          // Process tool calls internally
          const results = await handleToolCalls(
            ctx,
            finalToolCalls as OpenAI.Chat.Completions.ChatCompletionMessageToolCall[],
            { userId: identity.subject as Id<"users"> },
          );

          // Add tool results to messages for next iteration
          for (const result of results) {
            openaiMessages.push({
              role: "tool",
              content: JSON.stringify(result.content, null, 2),
              tool_call_id: result.tool_call_id,
            });
          }

          // Reset for next iteration
          finalToolCalls = [];
        } else {
          // If we have no tool calls, we're done
          await stream.writeSSE({
            data: "[DONE]",
          });
          return;
        }
      }

      await stream.writeSSE({
        data: "[ERROR] Maximum steps reached",
      });
    });
  } catch (error) {
    console.error("Error in direct completion:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});
