/******************************************************************************
 * GUARDS
 *
 * Authorization checks:
 * - ownershipGuard: Verifies notification ownership
 *   - Throws 403 error for unauthorized access
 ******************************************************************************/

import { Id } from "./_generated/dataModel";
import { ConvexError } from "convex/values";

/**
 * Check if the notification is owned by the user and throw an error if not.
 */
export const ownershipGuard = (
  userId: Id<"users">,
  notificationUserId: Id<"users">,
): void => {
  if (notificationUserId !== userId) {
    throw new ConvexError({
      message: "Not authorized to access this notification",
      code: 403,
    });
  }
};
