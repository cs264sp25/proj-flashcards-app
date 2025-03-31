/******************************************************************************
 * INTERNAL ACTIONS
 *
 * Internal actions for AI operations:
 * - completion: Handles streaming AI responses
 * - getEmbeddings: Generates and stores embeddings for decks/cards
 ******************************************************************************/

import { ConvexError } from "convex/values";
import { internalAction, ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";

import {
  completionArgsSchemaObject,
  CompletionArgsType,
  getEmbeddingsArgsSchemaObject,
  GetEmbeddingsArgsType,
} from "./openai_schema";
import {
  semanticSearchAmongCards,
  semanticSearchAmongDecks,
} from "./openai_tools";
import {
  getCompletion,
  getEmbedding as getEmbeddingHelper,
} from "./openai_helpers";

/**
 * Handles streaming AI responses using OpenAI's API.
 * Updates the message content incrementally as the response streams in.
 */
export const completion = internalAction({
  args: completionArgsSchemaObject,
  handler: async (ctx: ActionCtx, args: CompletionArgsType) => {
    const result = await getCompletion(
      [
        {
          role: "system",
          content: "You are a helpful assistant for a Flashcard app.",
        },
        ...args.messages,
      ],
      "gpt-4o-mini",
      0,
      10,
      {
        semanticSearchAmongDecks: semanticSearchAmongDecks(ctx, args),
        semanticSearchAmongCards: semanticSearchAmongCards(ctx, args),
      },
    );

    let fullResponse = "";
    for await (const delta of result.textStream) {
      fullResponse += delta;
      await ctx.runMutation(internal.messages_internals.updateMessage, {
        messageId: args.placeholderMessageId,
        content: fullResponse,
      });
    }
  },
});

/**
 * Generates embeddings for text and stores them in the appropriate document
 * (deck or card). Uses OpenAI's API for efficient vector embeddings.
 */
export const getEmbedding = internalAction({
  args: getEmbeddingsArgsSchemaObject,
  handler: async (ctx: ActionCtx, args: GetEmbeddingsArgsType) => {
    try {
      const { text, deckId, cardId } = args;
      const embedding = await getEmbeddingHelper(text);

      if (deckId) {
        await ctx.runMutation(
          internal.decks_internals.updateDeckWithEmbedding,
          {
            deckId,
            embedding,
          },
        );
      } else if (cardId) {
        await ctx.runMutation(
          internal.cards_internals.updateCardWithEmbedding,
          {
            cardId,
            embedding,
          },
        );
      }
    } catch (error) {
      console.error("Error getting embedding:", error);
      throw new ConvexError({
        code: 500,
        message: "Error getting embedding",
      });
    }
  },
});
