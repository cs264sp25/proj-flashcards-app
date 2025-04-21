/******************************************************************************
 * HELPERS
 *
 * Pure database operations without auth/authorization checks:
 * - Core CRUD operations:
 *   - getAllFiles: Basic file retrieval with optional filters
 *   - getFileById: Single file retrieval
 *   - createFile: Basic file creation
 *   - updateFile: Basic file update
 *   - deleteFile: Basic file deletion
 * - Special operations:
 *   - deleteAllFiles: Handles deletion of all files for a user or all files in the system
 ******************************************************************************/

import { IndexRangeBuilder, PaginationResult } from "convex/server";
import { ConvexError } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { QueryCtx, MutationCtx } from "./_generated/server";

import type { PaginationOptsType, SortOrderType } from "./shared";
import type { FileInType, FileUpdateType } from "./files_schema";

// Get all files with pagination and optional filtering by userId and sorting
export async function getAllFiles(
  ctx: QueryCtx,
  paginationOpts: PaginationOptsType,
  userId?: Id<"users">,
  sortOrder?: SortOrderType,
): Promise<PaginationResult<Doc<"files">>> {
  sortOrder = sortOrder || "asc";

  const results: PaginationResult<Doc<"files">> = await ctx.db
    .query("files")
    .withIndex(
      "by_user_id",
      (q: IndexRangeBuilder<Doc<"files">, ["userId", "_creationTime"], 0>) => {
        let q1;

        if (userId) {
          q1 = q.eq("userId", userId);
        }

        return q1 || q;
      },
    )
    .order(sortOrder)
    .paginate(paginationOpts);

  return {
    ...results,
    page: results.page, // This is the data (records) for the current page; we can transform it if needed
  };
}

export async function getFileById(
  ctx: QueryCtx,
  fileId: Id<"files">,
): Promise<Doc<"files">> {
  const file = await ctx.db.get(fileId);
  if (!file) {
    throw new ConvexError({
      message: `File ${fileId} not found`,
      code: 404,
    });
  }
  return file;
}

export async function createFile(
  ctx: MutationCtx,
  userId: Id<"users">,
  data: FileInType,
): Promise<Id<"files">> {
  return await ctx.db.insert("files", {
    ...data,
    userId,
    url: (await ctx.storage.getUrl(data.storageId)) as string,
  });
}

export async function updateFile(
  ctx: MutationCtx,
  fileId: Id<"files">,
  data: FileUpdateType,
): Promise<void> {
  await ctx.db.patch(fileId, data);
}

// Does not delete the actual file from the storage.
export async function deleteFile(
  ctx: MutationCtx,
  fileId: Id<"files">,
): Promise<void> {
  await ctx.db.delete(fileId);
}

// Can be used to delete all file for a user or all file in the system.
// Does not delete the actual files from the storage.
// TODO: This function is not efficient for large datasets. It should be
// changed to batch delete file over scheduled actions.
export async function deleteAllFiles(
  ctx: MutationCtx,
  userId?: Id<"users">,
): Promise<Id<"_storage">[]> {
  const files = await ctx.db
    .query("files")
    .withIndex(
      "by_user_id",
      (q: IndexRangeBuilder<Doc<"files">, ["userId", "_creationTime"], 0>) => {
        let q1;

        if (userId) {
          q1 = q.eq("userId", userId);
        }

        return q1 || q;
      },
    )
    .collect();

  const storageIds = files.map((file) => file.storageId);

  await Promise.all(files.map((file) => deleteFile(ctx, file._id)));

  return storageIds;
}
