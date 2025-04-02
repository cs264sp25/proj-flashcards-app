/******************************************************************************
 * USERS QUERIES MODULE
 *
 * This module contains query functions for user/auth operations.
 ******************************************************************************/
import { query } from "./_generated/server";
import { getAuthSessionId, getAuthUserId } from "@convex-dev/auth/server";

/**
 * Get the user from the authentication token.
 * Returns null if the user is not authenticated.
 */
export const getAuthenticatedUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    return await ctx.db.get(userId);
  },
});

/**
 * Get the current session from the authentication token.
 * Returns null if the user is not authenticated.
 */
export const getCurrentSession = query({
  args: {},
  handler: async (ctx) => {
    const sessionId = await getAuthSessionId(ctx);
    if (sessionId === null) {
      return null;
    }
    return await ctx.db.get(sessionId);
  },
});
