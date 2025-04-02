/******************************************************************************
 * MUTATIONS
 *
 * Responsibility chain:
 * 1. Data validation (convex validates args)
 * 2. Authentication check (using auth guard)
 * 3. Authorization check (using deck guard)
 * 4. Data operation (using helpers)
 * 5. Related operations (like cascade deletes)
 *
 * Available mutations:
 * - create: Create new deck
 * - update: Update existing deck
 * - remove: Delete deck with cascade
 ******************************************************************************/
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { MutationCtx, mutation } from "./_generated/server";

import { authenticationGuard } from "./users_guards";
import { ownershipGuard } from "./decks_guards";
import {
  createDeck,
  updateDeck,
  deleteDeckWithCascade,
  getDeckById,
} from "./decks_helpers";
import {
  DeckInType,
  DeckUpdateType,
  deckInSchema,
  deckUpdateSchema,
} from "./decks_schema";

/**
 * Create a new deck for the authenticated user.
 */
export const create = mutation({
  args: { ...deckInSchema },
  handler: async (ctx: MutationCtx, args: DeckInType): Promise<Id<"decks">> => {
    const userId = await authenticationGuard(ctx);
    return await createDeck(ctx, userId, args);
  },
});

/**
 * Update an existing deck.
 * The authenticated user must own the deck, or an error is thrown.
 */
export const update = mutation({
  args: {
    deckId: v.id("decks"),
    ...deckUpdateSchema,
  },
  handler: async (
    ctx: MutationCtx,
    args: DeckUpdateType & {
      deckId: Id<"decks">;
    },
  ): Promise<boolean> => {
    const { deckId, ...data } = args;
    const userId = await authenticationGuard(ctx);
    const deck = await getDeckById(ctx, deckId);
    ownershipGuard(userId, deck.userId);
    await updateDeck(ctx, deckId, data);
    return true;
  },
});

/**
 * Delete a deck (and its cards) given its ID.
 * The authenticated user must own the deck, or an error is thrown.
 */
export const remove = mutation({
  args: {
    deckId: v.id("decks"),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      deckId: Id<"decks">;
    },
  ): Promise<boolean> => {
    const userId = await authenticationGuard(ctx);
    const deck = await getDeckById(ctx, args.deckId);
    ownershipGuard(userId, deck.userId);
    await deleteDeckWithCascade(ctx, args.deckId);
    return true;
  },
});
