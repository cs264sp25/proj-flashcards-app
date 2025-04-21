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
  searchQuery?: string,
): Promise<PaginationResult<Doc<"files">>> {
  sortOrder = sortOrder || "asc";

  let results: PaginationResult<Doc<"files">>;

  // Use search index if searchQuery is provided
  if (searchQuery) {
    results = await ctx.db
      .query("files")
      .withSearchIndex("search_all", (q) => {
        if (userId) {
          return q
            .search("searchableContent", searchQuery)
            .eq("userId", userId);
        } else {
          // This case might need adjustment depending on whether you want
          // non-authenticated users or admins to search all files
          return q.search("searchableContent", searchQuery);
        }
      })
      // Order is determined by search relevance
      .paginate(paginationOpts);
  } else {
    // Otherwise, use the existing index query
    results = await ctx.db
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
  }

  return {
    ...results,
    page: results.page, // Return raw documents, map to FileOutType in query if needed
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
  const title = data.title || "";
  const description = data.description || "";
  const tags = data.tags || [];
  const searchableContent = `${title.trim()} ${description.trim()} ${tags.join(" ").trim()}`;

  return await ctx.db.insert("files", {
    ...data,
    userId,
    url: (await ctx.storage.getUrl(data.storageId)) as string,
    searchableContent,
  });
}

export async function updateFile(
  ctx: MutationCtx,
  fileId: Id<"files">,
  data: FileUpdateType,
): Promise<void> {
  // If title, description, or tags are updated, regenerate searchableContent
  if (data.title || data.description || data.tags) {
    const file = await getFileById(ctx, fileId); // Need existing file data
    const title = data.title || file.title;
    const description = data.description || file.description || "";
    const tags = data.tags || file.tags || [];
    const searchableContent = `${title.trim()} ${description.trim()} ${tags.join(" ").trim()}`;
    await ctx.db.patch(fileId, { ...data, searchableContent });
  } else {
    // Only patch the provided data if searchable fields are not changing
    await ctx.db.patch(fileId, data);
  }
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
