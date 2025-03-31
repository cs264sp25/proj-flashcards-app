/******************************************************************************
 * GUARDS
 *
 * Authorization checks:
 * - ownershipGuard: Verifies deck ownership
 *   - Throws 403 error for unauthorized access
 ******************************************************************************/
import { ConvexError } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Check if the deck is owned by the user and throw an error if not.
 */
export const ownershipGuard = (
  userId: Id<"users">,
  deckUserId: Id<"users">,
): void => {
  if (deckUserId !== userId) {
    throw new ConvexError({
      message: "Not authorized to access this deck",
      code: 403,
    });
  }
};
