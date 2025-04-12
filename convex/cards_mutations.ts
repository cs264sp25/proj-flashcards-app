/******************************************************************************
 * MUTATIONS
 *
 * Responsibility chain:
 * 1. Data validation (convex validates args)
 * 2. Authentication check (using auth guard)
 * 3. Authorization check (using card guard)
 * 4. Data operation (using helpers)
 * 5. Related operations (deck card count)
 *
 * Available mutations:
 * - create: Create new card
 * - update: Update existing card
 * - remove: Delete card
 ******************************************************************************/
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { MutationCtx, mutation } from "./_generated/server";
import { internal } from "./_generated/api";

import { authenticationGuard } from "./users_guards";
import { ownershipGuard, ownershipGuardThroughDeck } from "./cards_guards";
import {
  createCard,
  updateCard,
  deleteCard,
  getCardById,
} from "./cards_helpers";
import { adjustCardCount } from "./decks_helpers";
import {
  CardInType,
  CardUpdateType,
  cardInSchema,
  cardUpdateSchema,
} from "./cards_schema";

/**
 * Create a new card. The authenticated user must own the deck, or an error is
 * thrown.
 */
export const create = mutation({
  args: {
    ...cardInSchema,
    deckId: v.id("decks"),
  },
  handler: async (
    ctx: MutationCtx,
    args: CardInType & { deckId: Id<"decks"> },
  ): Promise<Id<"cards">> => {
    const userId = await authenticationGuard(ctx);
    await ownershipGuardThroughDeck(ctx, userId, args.deckId);
    const cardId = await createCard(ctx, args, args.deckId, userId);
    await adjustCardCount(ctx, args.deckId, 1);

    // Schedule the embedding generation
    const front = args.front || "";
    const back = args.back || "";
    const searchableContent = `${front.trim()} ${back.trim()}`;
    await ctx.scheduler.runAfter(0, internal.openai_internals.getEmbedding, {
      text: searchableContent,
      cardId,
    });

    return cardId;
  },
});

/**
 * Update an existing card. The authenticated user must own the deck, that cards
 * belongs do and the one that is being updated, or an error is thrown.
 */
export const update = mutation({
  args: {
    cardId: v.id("cards"),
    deckId: v.optional(v.id("decks")),
    ...cardUpdateSchema,
  },
  handler: async (
    ctx: MutationCtx,
    args: CardUpdateType & {
      cardId: Id<"cards">;
      deckId?: Id<"decks">;
    },
  ): Promise<boolean> => {
    const { cardId, deckId, ...data } = args;
    const userId = await authenticationGuard(ctx);
    const card = await getCardById(ctx, cardId);
    await ownershipGuard(userId, card.userId);

    let oldDeckId = card.deckId;
    let contentChanged = false;

    // Move card to a different deck?
    if (deckId && deckId !== card.deckId) {
      // Check if the new deck is owned by the user
      await ownershipGuardThroughDeck(ctx, userId, deckId);
      // Adjust card counts
      await adjustCardCount(ctx, card.deckId, -1);
      await adjustCardCount(ctx, deckId, 1);
      oldDeckId = deckId; // The card's deckId will be updated by updateCard
    }

    // Check if content is changing before updating
    if (data.front || data.back) {
      contentChanged = true;
    }

    // Update the card (including potential deckId change)
    await updateCard(ctx, cardId, { ...data, deckId: deckId }); // Ensure deckId is passed if changed

    // Schedule embedding regeneration if content changed
    if (contentChanged) {
      const front = data.front || card.front || "";
      const back = data.back || card.back || "";
      const searchableContent = `${front.trim()} ${back.trim()}`;
      await ctx.scheduler.runAfter(0, internal.openai_internals.getEmbedding, {
        text: searchableContent,
        cardId,
      });
    }

    return true;
  },
});

/**
 * Delete a card. The authenticated user must own the deck that contains this
 * card, or an error is thrown.
 */
export const remove = mutation({
  args: {
    cardId: v.id("cards"),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      cardId: Id<"cards">;
    },
  ): Promise<boolean> => {
    const userId = await authenticationGuard(ctx);
    const card = await getCardById(ctx, args.cardId);
    await ownershipGuard(userId, card.userId);
    await deleteCard(ctx, args.cardId);
    await adjustCardCount(ctx, card.deckId, -1);
    return true;
  },
});
