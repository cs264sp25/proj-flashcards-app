/******************************************************************************
 * HELPERS
 *
 * Pure database operations without auth/authorization for Assistants:
 * - Core CRUD operations:
 *   - getAllAssistants: Paginated/sorted/searchable assistant retrieval
 *   - getAssistantById: Single assistant retrieval
 *   - createAssistant: Basic assistant creation
 *      - Handles searchable content and OpenAI assistant creation
 *   - updateAssistant: Basic assistant update
 *      - Handles searchable content and OpenAI assistant updates
 *   - deleteAssistant: Basic assistant deletion
 *      - Handles OpenAI assistant deletion
 ******************************************************************************/

import { PaginationResult } from "convex/server";
import { ConvexError } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { QueryCtx, MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";

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
 * Note: Handles OpenAI Assistant creation.
 */
export async function createAssistant(
  ctx: MutationCtx,
  data: AssistantInType,
): Promise<Id<"assistants">> {
  // Prepare searchable content
  const name = (data.name || "").trim();
  const description = (data.description || "").trim();
  const searchableContent = `${name} ${description}`;

  const model = data.model || "gpt-4o-mini";
  const temperature = data.temperature || 1;

  // Add internal fields before insertion
  const assistantData = {
    ...data,
    name,
    description,
    searchableContent,
    model,
    temperature,
    openaiAssistantId: "pending", // Initialize as pending
  };

  const assistantId = await ctx.db.insert("assistants", assistantData);

  // Schedule an action to create the assistant in OpenAI
  await ctx.scheduler.runAfter(0, internal.openai_assistants.createAssistant, {
    assistantId, // Pass the new Convex ID
    ...data,
    name,
    description,
  });

  return assistantId;
}

/**
 * Update an assistant in the database.
 * Note: Handles OpenAI Assistant updates.
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

  // Update the assistant in the database
  await ctx.db.patch(assistantId, {
    ...data,
    name,
    description,
    searchableContent,
  });

  // Schedule an action to update the assistant in OpenAI if it has a real ID
  if (existing.openaiAssistantId && existing.openaiAssistantId !== "pending") {
    await ctx.scheduler.runAfter(
      0,
      internal.openai_assistants.updateAssistant,
      {
        assistantId: assistantId, // Pass the convex ID
        openaiAssistantId: existing.openaiAssistantId, // Pass the OpenAI ID
        // Pass only the fields that were provided for the update
        ...data,
        name,
        description,
      },
    );
  }
}

/**
 * Delete an assistant from the database.
 * Note: Handles OpenAI Assistant deletion.
 */
export async function deleteAssistant(
  ctx: MutationCtx,
  assistantId: Id<"assistants">,
): Promise<void> {
  // Ensure the assistant exists before deleting
  const existing = await getAssistantById(ctx, assistantId);
  await ctx.db.delete(existing._id);

  // Schedule an action to delete the assistant in OpenAI if it has a real ID
  if (existing.openaiAssistantId && existing.openaiAssistantId !== "pending") {
    await ctx.scheduler.runAfter(
      0,
      internal.openai_assistants.deleteAssistant,
      {
        openaiAssistantId: existing.openaiAssistantId,
      },
    );
  }
}
