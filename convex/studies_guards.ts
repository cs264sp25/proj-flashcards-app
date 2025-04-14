/******************************************************************************
 * GUARDS
 *
 * Authorization checks:
 * - ownershipGuard: Verifies study ownership
 *   - Throws 403 error for unauthorized access
 ******************************************************************************/
import { ConvexError } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Check if the study is owned by the user and throw an error if not.
 */
export const ownershipGuard = (
  userId: Id<"users">,
  studyUserId: Id<"users">,
): void => {
  if (studyUserId !== userId) {
    throw new ConvexError({
      message: "Not authorized to access this study",
      code: 403, // Forbidden
    });
  }
};
