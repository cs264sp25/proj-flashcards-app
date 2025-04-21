/******************************************************************************
 * INTERNALS
 *
 * Internal operations not exposed to clients:
 * - Used by other operations like seeding and AI actions
 * - Bypasses auth/authorization for internal use
 ******************************************************************************/
import { v } from "convex/values";
import { paginationOptsValidator, PaginationResult } from "convex/server";
import { Doc, Id } from "./_generated/dataModel";
import {
  QueryCtx,
  MutationCtx,
  internalQuery,
  internalMutation,
} from "./_generated/server";

import { PaginationOptsType, SortOrder, SortOrderType } from "./shared";
import {
  getAllFiles as getAllFilesHelper,
  createFile as createFileHelper,
  deleteAllFiles as deleteAllFilesHelper,
} from "./files_helpers";
import { fileInSchema, FileInType } from "./files_schema";

/**
 * Get all files for the given user, optionally sorted by the given order
 */
export const getAllFiles = internalQuery({
  args: {
    paginationOpts: paginationOptsValidator,
    sortOrder: v.optional(SortOrder),
    userId: v.id("users"),
  },
  handler: async (
    ctx: QueryCtx,
    args: {
      paginationOpts: PaginationOptsType;
      sortOrder?: SortOrderType;
      userId: Id<"users">;
    },
  ): Promise<PaginationResult<Doc<"files">>> => {
    return await getAllFilesHelper(
      ctx,
      args.paginationOpts,
      args.userId,
      args.sortOrder,
    );
  },
});

/**
 * Create a new file for the given user.
 * An internal mutation wrapper around the createFile helper.
 * Used when we want to create a file in a different context (ctx) like in Actions.
 */
export const createFile = internalMutation({
  args: {
    userId: v.id("users"),
    file: v.object(fileInSchema),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      userId: Id<"users">;
      file: FileInType;
    },
  ): Promise<Id<"files">> => {
    return await createFileHelper(ctx, args.userId, args.file);
  },
});

/**
 * Delete all file for the given user.
 * An internal mutation wrapper around the deleteAllFiles helper.
 * Used when we want to delete file in a different context (ctx) like in seeding Actions.
 */
export const deleteFiles = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      userId: Id<"users">;
    },
  ): Promise<Id<"_storage">[]> => {
    return await deleteAllFilesHelper(ctx, args.userId);
  },
});
