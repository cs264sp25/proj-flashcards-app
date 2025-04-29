/******************************************************************************
 * OPENAI EMBEDDINGS
 *
 * Handles embedding text using OpenAI's API.
 ******************************************************************************/

import { ConvexError } from "convex/values";
import { internalAction, ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";

import {
  EmbeddingType,
  getEmbeddingsArgsSchemaObject,
  GetEmbeddingsArgsType,
} from "./openai_schema";
import { openai } from "./openai_helpers";

const DEBUG = true;

/**
 * Get embedding from OpenAI
 */
export async function getEmbeddingHelper(text: string): Promise<EmbeddingType> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });

    return {
      embedding: response.data[0].embedding,
    };
  } catch (error) {
    console.error("[getEmbeddingHelper]: Error getting embedding:", error);
    throw error;
  }
}

/**
 * Generates embeddings for text and returns them.
 * If deckId or cardId is provided, the embedding is stored in the appropriate document.
 * The embedding is generated using OpenAI's API for efficient vector embeddings.
 */
export const getEmbedding = internalAction({
  args: getEmbeddingsArgsSchemaObject,
  handler: async (
    ctx: ActionCtx,
    args: GetEmbeddingsArgsType,
  ): Promise<{ embedding: number[] }> => {
    try {
      if (DEBUG) {
        console.log("[getEmbedding]: Starting embedding action");
      }

      const { text, deckId, cardId } = args;
      const { embedding } = await getEmbeddingHelper(text);

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
      return { embedding };
    } catch (error) {
      console.error("[getEmbedding]: Error getting embedding:", error);
      throw new ConvexError({
        code: 500,
        message: "Error getting embedding",
      });
    }
  },
});
