/******************************************************************************
 * USERS HELPERS MODULE
 *
 * This module contains utility functions for user operations.
 ******************************************************************************/
import { ConvexError } from "convex/values";
import { QueryCtx, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

import type { PaginationOptsType, SortOrderType } from "./shared";
import type { UserUpdateType } from "./users_schema";
import { deleteAllStudies } from "./studies_helpers";
import { deleteAllDecksWithCascade } from "./decks_helpers";
import { deleteAllChatsWithCascade } from "./chats_helpers";

/**
 * Get all users with pagination and optional sorting
 */
export async function getAllUsers(
  ctx: QueryCtx,
  paginationOpts: PaginationOptsType,
  sortOrder?: SortOrderType,
) {
  sortOrder = sortOrder || "asc";

  const results = await ctx.db
    .query("users")
    .order(sortOrder)
    .paginate(paginationOpts);

  return {
    ...results,
    page: results.page,
  };
}

/**
 * Get a user by their ID
 */
export async function getUserById(ctx: QueryCtx, userId: Id<"users">) {
  const user = await ctx.db.get(userId);
  if (!user) {
    throw new ConvexError({
      message: `User ${userId} not found`,
      code: 404,
    });
  }
  return user;
}

/**
 * Update a user's information
 */
export async function updateUser(
  ctx: MutationCtx,
  userId: Id<"users">,
  data: UserUpdateType,
) {
  await ctx.db.patch(userId, data);
}

/**
 * Delete a user
 */
export async function deleteUser(ctx: MutationCtx, userId: Id<"users">) {
  await ctx.db.delete(userId);
}

/**
 * Delete a user and all associated data
 * This is helpful when a user wants to delete their account
 * This function can reach Convex limit if called in a mutation.
 * It's better to call this function in a background job.
 */
export async function deleteUserWithCascade(
  ctx: MutationCtx,
  userId: Id<"users">,
) {
  // Delete all study sessions for the user
  await deleteAllStudies(ctx, userId);
  // Delete all decks and cards for the user
  await deleteAllDecksWithCascade(ctx, userId);
  // Delete all chats for the user
  await deleteAllChatsWithCascade(ctx, userId);

  // Delete the user
  await deleteUser(ctx, userId);
}
