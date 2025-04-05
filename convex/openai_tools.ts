/******************************************************************************
 * OPENAI TOOLS
 *
 * Tools which OpenAI can use to perform actions in the app.
 * - semanticSearchAmongDecks: Searches for relevant decks based on a query.
 * - semanticSearchAmongCards: Searches for relevant cards based on a query.
 ******************************************************************************/
import { tool } from "ai";
import { ActionCtx } from "./_generated/server";
import { z } from "zod";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

const DEBUG = false;

export const semanticSearchAmongDecks = (
  ctx: ActionCtx,
  args: {
    userId: Id<"users">;
    placeholderMessageId: Id<"messages">;
  },
) => {
  return tool({
    description: "Given a query, return the most relevant decks for this user",
    parameters: z.object({
      query: z.string().describe("The query to search for relevant decks"),
      limit: z
        .optional(z.number())
        .describe("The number of decks to return. Defaults to 10."),
    }),
    execute: async ({ query, limit }) => {
      if (DEBUG) {
        console.log("Semantic search among decks");
        console.log("Query:", query);
        console.log("Limit:", limit);
      }

      if (DEBUG) {
        console.log("User ID:", args.userId);
        console.log(
          "Going to update placeholder message and run semantic search",
        );
      }

      await ctx.runMutation(internal.messages_internals.updateMessage, {
        messageId: args.placeholderMessageId,
        content: `🔍 Searching for information among decks...`,
      });
      return ctx.runAction(internal.decks_internals.semanticSearch, {
        query,
        userId: args.userId,
        limit,
      });
    },
  });
};

export const semanticSearchAmongCards = (
  ctx: ActionCtx,
  args: {
    userId: Id<"users">;
    placeholderMessageId: Id<"messages">;
  },
) => {
  return tool({
    description: "Given a query, return the most relevant cards for this user",
    parameters: z.object({
      query: z.string().describe("The query to search for relevant cards"),
      limit: z
        .optional(z.number())
        .describe("The number of cards to return. Defaults to 10."),
    }),
    execute: async ({ query, limit }) => {
      if (DEBUG) {
        console.log("Semantic search among cards");
        console.log("Query:", query);
        console.log("Limit:", limit);
      }

      if (DEBUG) {
        console.log("User ID:", args.userId);
        console.log(
          "Going to update placeholder message and run semantic search",
        );
      }

      await ctx.runMutation(internal.messages_internals.updateMessage, {
        messageId: args.placeholderMessageId,
        content: `🔍 Searching for information among cards...`,
      });
      return ctx.runAction(internal.cards_internals.semanticSearch, {
        query,
        userId: args.userId,
        limit,
      });
    },
  });
};
