/******************************************************************************
 * GUARDS
 *
 * Authorization checks:
 * - ownershipGuard: Verifies card ownership
 *   - Throws 403 error for unauthorized access
 * - ownershipGuardThroughDeck: Verifies card ownership through deck ownership
 *   - Throws 403 error for unauthorized access
 ******************************************************************************/
import { ConvexError } from "convex/values";
import { Id } from "./_generated/dataModel";
import { getDeckById } from "./decks_helpers";
import { QueryCtx } from "./_generated/server";

/**
 * Check if the user owns the card and throw an error if not.
 */
export const ownershipGuard = async (
  userId: Id<"users">,
  cardUserId: Id<"users">,
): Promise<void> => {
  if (cardUserId !== userId) {
    throw new ConvexError({
      message: "Not authorized to access this card",
      code: 403,
    });
  }
};

/**
 * Check if the user owns the deck that contains the card and throw an error if not.
 */
export const ownershipGuardThroughDeck = async (
  ctx: QueryCtx,
  userId: Id<"users">,
  deckId: Id<"decks">,
): Promise<void> => {
  const deck = await getDeckById(ctx, deckId);
  if (deck.userId !== userId) {
    throw new ConvexError({
      message: "Not authorized to access this card",
      code: 403,
    });
  }
};
