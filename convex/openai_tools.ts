/******************************************************************************
 * OPENAI TOOLS
 *
 * Tools which OpenAI can use to perform actions in the app.
 * - semanticSearchAmongDecksTool: Searches for relevant decks based on a query.
 * - semanticSearchAmongCardsTool: Searches for relevant cards based on a query.
 * - handleFunctionCall: Handles a single function call from OpenAI.
 ******************************************************************************/

import { internal } from "./_generated/api";
import { ConvexError } from "convex/values";
import { ActionCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

import OpenAI from "openai";

const DEBUG = true;

export const semanticSearchAmongDecksTool: OpenAI.Chat.Completions.ChatCompletionTool =
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
  };

export const semanticSearchAmongCardsTool: OpenAI.Chat.Completions.ChatCompletionTool =
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
  };

// Define the tools using OpenAI's function schema
export const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  semanticSearchAmongDecksTool,
  semanticSearchAmongCardsTool,
];

/**
 * Function to handle a single function call from OpenAI
 */
export async function handleFunctionCall(
  ctx: ActionCtx,
  tool_call: OpenAI.Chat.Completions.ChatCompletionMessageToolCall,
  userId: Id<"users">,
) {
  if (DEBUG) {
    console.log("[handleFunctionCall]: Handling function call:", tool_call.function.name);
  }

  const functionName = tool_call.function.name;
  const functionArgs = JSON.parse(tool_call.function.arguments!);
  if (DEBUG) {
    console.log("[handleFunctionCall]: Function arguments:", functionArgs);
  }

  switch (functionName) {
    case "semanticSearchAmongDecks":
      if (DEBUG) {
        console.log("[handleFunctionCall]: Executing semantic search among decks");
      }
      return ctx.runAction(internal.decks_internals.semanticSearch, {
        query: functionArgs.query,
        limit: functionArgs.limit,
        userId,
      });

    case "semanticSearchAmongCards":
      if (DEBUG) {
        console.log("[handleFunctionCall]: Executing semantic search among cards");
      }
      return ctx.runAction(internal.cards_internals.semanticSearch, {
        query: functionArgs.query,
        limit: functionArgs.limit,
        userId,
      });

    default:
      if (DEBUG) {
        console.log("[handleFunctionCall]: Unknown function called:", functionName);
      }
      throw new ConvexError({
        code: 500,
        message: `Unknown function: ${tool_call.function.name}`,
      });
  }
}
