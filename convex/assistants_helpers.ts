/******************************************************************************
 * HELPERS
 *
 * Pure database operations without auth/authorization for Assistants:
 * - Core CRUD operations:
 *   - getAllAssistants: Paginated/sorted/searchable assistant retrieval
 *   - getAssistantById: Single assistant retrieval
 *   - createAssistant: Basic assistant creation (handles searchable content)
 *   - updateAssistant: Basic assistant update (handles searchable content)
 *   - deleteAssistant: Basic assistant deletion
 ******************************************************************************/

import { PaginationResult } from "convex/server";
import { ConvexError } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { QueryCtx, MutationCtx } from "./_generated/server";

import { AssistantInType, AssistantUpdateType } from "./assistants_schema";
import { PaginationOptsType, SortOrderType } from "./shared";

/**
 * Get all assistants, optionally sorted, paginated, and filtered by search query.
 */
export async function getAllAssistants(
  ctx: QueryCtx,
  paginationOpts: PaginationOptsType,
  sortOrder?: SortOrderType,
  searchQuery?: string,
): Promise<PaginationResult<Doc<"assistants">>> {
  sortOrder = sortOrder || "asc"; // Default sort order

  let results: PaginationResult<Doc<"assistants">>;

  if (searchQuery) {
    // Perform search if query is provided
    results = await ctx.db
      .query("assistants")
      .withSearchIndex("search_all", (q) =>
        // Add filters here if needed, e.g., q.eq("ownerId", ownerId)
        q.search("searchableContent", searchQuery),
      )
      // The order will be the order of the search results
      .paginate(paginationOpts);
  } else {
    // Otherwise, perform a standard query with optional sorting
    results = await ctx.db
      .query("assistants")
      .order(sortOrder)
      .paginate(paginationOpts);
  }

  return results;
}

/**
 * Get an assistant by its database ID.
 */
export async function getAssistantById(
  ctx: QueryCtx,
  assistantId: Id<"assistants">,
): Promise<Doc<"assistants">> {
  const assistant = await ctx.db.get(assistantId);
  if (!assistant) {
    throw new ConvexError({
      message: `Assistant ${assistantId} not found`,
      code: 404,
    });
  }

  return assistant;
}

/**
 * Create a new assistant in the database.
 * Note: Does not handle OpenAI Assistant creation.
 */
export async function createAssistant(
  ctx: MutationCtx,
  data: AssistantInType,
): Promise<Id<"assistants">> {
  // Prepare searchable content
  const name = (data.name || "").trim();
  const description = (data.description || "").trim();
  const searchableContent = `${name} ${description}`;

  // Add internal fields before insertion
  const assistantData = {
    ...data,
    openaiAssistantId: "pending", // Initialize as pending
    searchableContent,
  };
  return await ctx.db.insert("assistants", assistantData);
}

/**
 * Update an assistant in the database.
 * Note: Does not handle OpenAI Assistant updates.
 */
export async function updateAssistant(
  ctx: MutationCtx,
  assistantId: Id<"assistants">,
  data: AssistantUpdateType,
): Promise<void> {
  // Ensure the assistant exists before patching
  const existing = await getAssistantById(ctx, assistantId);

  // Prepare searchable content based on update
  const name = (data.name || existing.name || "").trim();
  const description = (data.description || existing.description || "").trim();
  const searchableContent = `${name} ${description}`;

  await ctx.db.patch(assistantId, {
    ...data,
    searchableContent,
  });
}

/**
 * Delete an assistant from the database.
 * Note: Does not handle OpenAI Assistant deletion.
 */
export async function deleteAssistant(
  ctx: MutationCtx,
  assistantId: Id<"assistants">,
): Promise<void> {
  // Ensure the assistant exists before deleting
  const existing = await getAssistantById(ctx, assistantId);
  await ctx.db.delete(existing._id);
}
