/******************************************************************************
 * QUERIES
 *
 * Responsibility chain:
 * 1. Authentication check (using auth guard)
 * 2. Authorization check (using file guard)
 * 3. Data operation (using helpers)
 *
 * Available queries:
 * - getAll: Get all files for the authenticated user
 * - getOne: Get a single file by ID
 ******************************************************************************/
import { paginationOptsValidator, PaginationResult } from "convex/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { QueryCtx, query } from "./_generated/server";

import { PaginationOptsType, SortOrder, SortOrderType } from "./shared";
import { authenticationGuard } from "./users_guards";

import { ownershipGuard } from "./files_guards";
import { getAllFiles, getFileById } from "./files_helpers";
import { FileOutType } from "./files_schema";

/**
 * Get all files for the authenticated user, optionally sorted by the given order
 */
export const getAll = query({
  args: {
    paginationOpts: paginationOptsValidator,
    sortOrder: v.optional(SortOrder),
    searchQuery: v.optional(v.string()),
  },
  handler: async (
    ctx: QueryCtx,
    args: {
      paginationOpts: PaginationOptsType;
      sortOrder?: SortOrderType;
      searchQuery?: string;
    },
  ): Promise<PaginationResult<FileOutType>> => {
    const userId = await authenticationGuard(ctx);
    const results = await getAllFiles(
      ctx,
      args.paginationOpts,
      userId,
      args.sortOrder,
      args.searchQuery,
    );
    return {
      ...results,
      page: results.page.map((file) => ({
        _id: file._id,
        _creationTime: file._creationTime,
        title: file.title,
        description: file.description,
        tags: file.tags,
        storageId: file.storageId,
      })),
    };
  },
});

/**
 * Get a single file by ID.
 * The authenticated user must own the file, or an error is thrown.
 */
export const getOne = query({
  args: {
    fileId: v.id("files"),
  },
  handler: async (
    ctx: QueryCtx,
    args: {
      fileId: Id<"files">;
    },
  ): Promise<FileOutType> => {
    const userId = await authenticationGuard(ctx);
    const file = await getFileById(ctx, args.fileId);
    ownershipGuard(userId, file.userId);
    return {
      _id: file._id,
      _creationTime: file._creationTime,
      title: file.title,
      description: file.description,
      tags: file.tags,
      storageId: file.storageId,
    };
  },
});
