/******************************************************************************
 * HTTP HELPERS
 *
 * Helper functions for HTTP requests.
 ******************************************************************************/

import { Id } from "./_generated/dataModel";
import { ActionCtx } from "./_generated/server";

const DEBUG = true;

/**
 * Get the user ID from the authorization token
 */
export async function getUserId(ctx: ActionCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    if (DEBUG) {
      console.error(
        "[getUserId]: ERROR: Missing or invalid authorization token",
      );
    }
    return null;
  }

  if (DEBUG) {
    const { tokenIdentifier, subject, issuer } = identity;
    console.log("[getUserId]: identity", {
      tokenIdentifier,
      subject,
      issuer,
    });
  }

  const userId = identity.subject.split("|")[0] as Id<"users">;

  return userId;
}
