/******************************************************************************
 * GUARDS
 *
 * Authorization checks:
 * - ownershipGuard: Verifies file ownership
 *   - Throws 403 error for unauthorized access
 ******************************************************************************/

import { ConvexError } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Check if the file is owned by the user and throw an error if not.
 */
export const ownershipGuard = (
  userId: Id<"users">,
  fileUserId: Id<"users">,
): void => {
  if (fileUserId !== userId) {
    throw new ConvexError({
      message: "Not authorized to access this file",
      code: 403,
    });
  }
};
