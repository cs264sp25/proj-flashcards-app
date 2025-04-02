/******************************************************************************
 * GUARDS
 *
 * Authorization checks:
 * - ownershipGuard: Verifies message ownership through chat ownership
 *   - Throws 403 error for unauthorized access
 ******************************************************************************/
import { ConvexError } from "convex/values";
import { Id } from "./_generated/dataModel";
import { QueryCtx } from "./_generated/server";
import { getChatById } from "./chats_helpers";

/**
 * Check if the message is owned by the user (through chat ownership) and throw an error if not.
 */
export const ownershipGuardThroughChat = async (
  ctx: QueryCtx,
  userId: Id<"users">,
  chatId: Id<"chats">,
): Promise<void> => {
  const chat = await getChatById(ctx, chatId);
  if (chat.userId !== userId) {
    throw new ConvexError({
      message: "Not authorized to access this message",
      code: 403,
    });
  }
};
