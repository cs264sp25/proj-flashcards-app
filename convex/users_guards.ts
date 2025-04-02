/******************************************************************************
 * USERS GUARDS MODULE
 *
 * This module contains authentication guards and checks for user operations.
 ******************************************************************************/
import { ConvexError } from "convex/values";
import { QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Helper function to get the user ID from the authentication token.
 * Throws an error if the user is not authenticated.
 */
export const authenticationGuard = async (ctx: QueryCtx) => {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new ConvexError({
      message: "Not authenticated",
      code: 401,
    });
  }
  return userId;
};
