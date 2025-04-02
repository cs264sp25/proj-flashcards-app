/******************************************************************************
 * GUARDS
 *
 * Authorization checks:
 * - ownershipGuard: Verifies chat ownership
 *   - Throws 403 error for unauthorized access
 ******************************************************************************/
import { ConvexError } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Check if the chat is owned by the user and throw an error if not.
 */
export const ownershipGuard = (
  userId: Id<"users">,
  chatUserId: Id<"users">,
): void => {
  if (chatUserId !== userId) {
    throw new ConvexError({
      message: "Not authorized to access this chat",
      code: 403,
    });
  }
};
