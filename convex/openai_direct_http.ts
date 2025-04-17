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
  if (DEBUG)
    console.log("[DEBUG] Handling function call:", tool_call.function.name);
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
      console.error("ERROR: Missing or invalid authorization token");
      return c.json({ error: "Missing or invalid authorization token" }, 401);
    }

    if (DEBUG) {
      const { tokenIdentifier, subject, issuer } = identity;
      console.log("DEBUG: identity", {
        tokenIdentifier,
        subject,
        issuer,
      });
    }

    // --- Get Raw Request Body ---
    const rawRequestBody = await c.req.json();
    if (DEBUG) {
      console.log("DEBUG: Raw Request Body:", rawRequestBody);
    }

    // --- Schema-based Validation ---
    const validationResult = completionRequestSchema.safeParse(rawRequestBody);
    if (!validationResult.success) {
      console.error(
        `ERROR: Input validation failed for direct completion request:`,
        validationResult.error.flatten(),
      );
      return c.json(
        {
          error: "Invalid input for the direct completion request",
          details: validationResult.error.flatten(),
        },
        400,
      );
    }

    const { messageId } = validationResult.data;

    // Get the message and its chat history
    const message = await ctx.runQuery(
      internal.messages_internals.getMessageById,
      {
        messageId: messageId as Id<"messages">,
      },
    );

    if (!message) {
      console.error("ERROR: Message not found");
      return c.json({ error: "Message not found" }, 404);
    }

    if (DEBUG) {
      console.log("DEBUG: Found message:", message);
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

    if (DEBUG) {
      console.log("DEBUG: Chat history:", messages);
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Add system message
    const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
      [
        {
          role: "system",
          content: chat.system,
        },
        ...messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      ];

    if (DEBUG) {
      console.log("DEBUG: Initial messages:", openaiMessages);
    }

    return streamSSE(c, async (stream) => {
      let fullContent = "";
      let finalToolCalls: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[] =
        [];

      const maxSteps = 5;
      let step = 1;

      while (step <= maxSteps) {
        if (DEBUG) {
          console.log("[DEBUG] Starting step", step, "of", maxSteps);
        }
        step++;

        const openaiStream = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: openaiMessages,
          tools: tools,
          stream: true,
          tool_choice: "auto",
        });

        if (DEBUG) {
          console.log("DEBUG: Starting streaming response");
        }

        for await (const chunk of openaiStream) {
          const contentChunk = chunk.choices[0]?.delta?.content;
          const toolCallsChunk = chunk.choices[0]?.delta?.tool_calls;

          if (toolCallsChunk) {
            if (DEBUG) {
              console.log("DEBUG: Received tool call chunk:", toolCallsChunk);
            }
            for (const toolCall of toolCallsChunk) {
              const { index } = toolCall;

              if (!finalToolCalls[index]) {
                finalToolCalls[index] = {
                  id: toolCall.id!,
                  type: toolCall.type!,
                  function: {
                    name: toolCall.function!.name!,
                    arguments: toolCall.function!.arguments!,
                  },
                };
                if (DEBUG) {
                  console.log(
                    "DEBUG: Created new tool call:",
                    finalToolCalls[index],
                  );
                }
              } else {
                if (toolCall.id) finalToolCalls[index].id = toolCall.id;
                if (toolCall.type) finalToolCalls[index].type = toolCall.type;
                if (toolCall.function?.name)
                  finalToolCalls[index].function!.name = toolCall.function.name;
                if (toolCall.function?.arguments) {
                  finalToolCalls[index].function!.arguments =
                    (finalToolCalls[index].function!.arguments || "") +
                    toolCall.function.arguments;
                }
                if (DEBUG) {
                  console.log(
                    "DEBUG: Updated tool call:",
                    finalToolCalls[index],
                  );
                }
              }
            }
          } else if (contentChunk) {
            fullContent += contentChunk || "";
            if (DEBUG) {
              console.log("DEBUG: Received content chunk:", contentChunk);
            }
            await stream.writeSSE({
              data: contentChunk,
            });
          }
        }

        if (finalToolCalls.length > 0) {
          if (DEBUG) {
            console.log("DEBUG: Processing tool calls:", finalToolCalls);
          }
          // Add the assistant message with tool calls
          openaiMessages.push({
            role: "assistant",
            content: null,
            tool_calls: finalToolCalls,
          });

          // Process tool calls
          const results = await handleToolCalls(ctx, finalToolCalls, {
            userId: identity.subject.split("|")[0] as Id<"users">,
          });

          if (DEBUG) {
            console.log("DEBUG: Tool call results:", results);
          }

          // Add tool results
          for (const result of results) {
            openaiMessages.push({
              role: "tool",
              content: JSON.stringify(result.content, null, 2),
              tool_call_id: result.tool_call_id,
            });
          }

          if (DEBUG) {
            console.log(
              "DEBUG: Updated messages with tool results:",
              openaiMessages,
            );
          }

          // Reset for next iteration
          finalToolCalls = [];
        } else {
          // If we have no tool calls, we're done
          if (DEBUG) {
            console.log("DEBUG: No tool calls, sending completion marker");
          }
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
