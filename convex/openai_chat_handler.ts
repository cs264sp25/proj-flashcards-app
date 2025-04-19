/******************************************************************************
 * OPENAI COMPLETION ROUTE HANDLER
 *
 * Handles streaming AI responses for various tasks
 ******************************************************************************/
import { Hono } from "hono";
import { HonoWithConvex } from "convex-helpers/server/hono";
import { Id } from "./_generated/dataModel";
import { ActionCtx } from "./_generated/server";

import { z } from "zod";
import { internal } from "./_generated/api";
import OpenAI from "openai";
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

export const chatRoute: HonoWithConvex<ActionCtx> = new Hono();

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
      throw new Error(`Unknown function: ${tool_call.function.name}`);
  }
}

chatRoute.post("/chat", async (c) => {
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
    if (DEBUG) console.log("DEBUG: Raw Request Body:", rawRequestBody);

    // --- Schema-based Validation ---
    const chatRequestBodySchema = z.object({
      messageId: z.string(),
    });

    const validationResult = chatRequestBodySchema.safeParse(rawRequestBody);
    if (!validationResult.success) {
      console.error(
        `ERROR: Input validation failed for chat request:`,
        validationResult.error.flatten(),
      );
      return c.json(
        {
          error: "Invalid input for the chat request",
          details: validationResult.error.flatten(),
        },
        400,
      );
    }

    const { messageId } = validationResult.data;

    // Get the message
    const message = await ctx.runQuery(
      internal.messages_internals.getMessageById,
      {
        messageId: messageId as Id<"messages">,
      },
    );

    if (!message) {
      return c.json({ error: "Message not found" }, 404);
    }

    // Get the chat
    const chat = await ctx.runQuery(internal.chats_internals.getChatById, {
      chatId: message.chatId,
    });

    if (!chat) {
      return c.json({ error: "Chat not found" }, 404);
    }

    // Check if we have the required OpenAI IDs
    if (!chat.openaiThreadId || !chat.assistantId) {
      if (DEBUG)
        console.log(
          "[DEBUG] Missing OpenAI IDs, falling back to direct completion",
        );
      // Redirect to direct-completion endpoint
      return c.redirect(`/ai/direct-completion`, 307);
    }

    // Get the assistant
    const assistant = await ctx.runQuery(
      internal.assistants_internals.getAssistantById,
      {
        assistantId: chat.assistantId,
      },
    );

    if (!assistant) {
      return c.json({ error: "Assistant not found" }, 404);
    }

    if (!assistant.openaiAssistantId) {
      if (DEBUG)
        console.log(
          "[DEBUG] Missing OpenAI assistant ID, falling back to direct completion",
        );
      // Redirect to direct-completion endpoint
      return c.redirect(`/ai/direct-completion`, 307);
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    return streamSSE(c, async (stream) => {
      try {
        // Create a streaming run
        const run = await openai.beta.threads.runs.create(
          chat.openaiThreadId!,
          {
            assistant_id: assistant.openaiAssistantId!,
            tools: tools,
            stream: true,
          },
        );

        for await (const event of run) {
          if (DEBUG) console.log("Event:", event);

          switch (event.event) {
            case "thread.message.delta":
              // Handle text content streaming
              if (event.data.delta.content) {
                for (const content of event.data.delta.content) {
                  if (content.type === "text" && content.text?.value) {
                    // Ensure newlines are preserved by sending the content as-is
                    await stream.writeSSE({
                      data: content.text.value,
                    });
                    // Add a small delay to ensure proper streaming
                    await new Promise(resolve => setTimeout(resolve, 10));
                  }
                }
              }
              break;

            case "thread.run.requires_action":
              // Handle tool calls
              if (event.data.required_action?.type === "submit_tool_outputs") {
                const toolCalls =
                  event.data.required_action.submit_tool_outputs.tool_calls;

                // Process each tool call
                const toolOutputs: OpenAI.Beta.Threads.Runs.RunSubmitToolOutputsParams.ToolOutput[] = [];
                for (const toolCall of toolCalls) {
                  const result = await handleFunctionCall(ctx, toolCall, {
                    userId: identity.subject.split("|")[0] as Id<"users">,
                  });

                  toolOutputs.push({
                    tool_call_id: toolCall.id,
                    output: JSON.stringify(result),
                  });
                }

                // Get the thread and run IDs from the event
                const threadId = chat.openaiThreadId!;
                const runId = event.data.id;

                // Submit tool outputs and continue streaming
                const continuedStream =
                  openai.beta.threads.runs.submitToolOutputsStream(
                    threadId,
                    runId,
                    {
                      tool_outputs: toolOutputs,
                      stream: true,
                    },
                  );

                // Continue streaming the response
                for await (const continuedEvent of continuedStream) {
                  if (continuedEvent.event === "thread.message.delta") {
                    if (continuedEvent.data.delta.content) {
                      for (const content of continuedEvent.data.delta.content) {
                        if (content.type === "text" && content.text?.value) {
                          await stream.writeSSE({
                            data: content.text.value,
                          });
                        }
                      }
                    }
                  } else if (continuedEvent.event === "thread.run.completed") {
                    await stream.writeSSE({
                      data: "[DONE]",
                    });
                    return;
                  } else if (continuedEvent.event === "thread.run.failed") {
                    await stream.writeSSE({
                      data:
                        "[ERROR] " +
                        (continuedEvent.data.last_error?.message ||
                          "Unknown error"),
                    });
                    return;
                  }
                }
              }
              break;

            case "thread.run.completed":
              // Send completion marker
              await stream.writeSSE({
                data: "[DONE]",
              });
              return;

            case "thread.run.failed":
              // Send error marker
              await stream.writeSSE({
                data:
                  "[ERROR] " +
                  (event.data.last_error?.message || "Unknown error"),
              });
              return;
          }
        }
      } catch (error) {
        console.error("Error in streaming run:", error);
        await stream.writeSSE({
          data:
            "[ERROR] " +
            (error instanceof Error ? error.message : "Unknown error"),
        });
      }
    });
  } catch (error) {
    console.error("Error in chat handler:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});
