/******************************************************************************
 * HELPERS
 *
 * Pure database operations without auth/authorization:
 * - Core CRUD operations:
 *   - getAllCards: Basic card retrieval with optional filters
 *   - getCardById: Single card retrieval
 *   - createCard: Basic card creation
 *   - updateCard: Basic card update
 *   - deleteCard: Basic card deletion
 * - Special operations:
 *   - removeAllCardsInDeck: Handles deletion of all cards in a deck
 *   - removeAllCardsForUser: Handles deletion of all cards for a user
 *   - getCardSamplesForContext: Get a sample of cards from a deck
 ******************************************************************************/
import { IndexRangeBuilder, PaginationResult } from "convex/server";
import { ConvexError } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { QueryCtx, MutationCtx, ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";

import { CardInType, CardOutType, CardUpdateType } from "./cards_schema";
import { PaginationOptsType, SortOrderType } from "./shared";

/**
 * Get all cards in the given deck, optionally sorted by the given order,
 * optionally filtered by a search query.
 */
export async function getAllCards(
  ctx: QueryCtx,
  paginationOpts: PaginationOptsType,
  deckId?: Id<"decks">,
  sortOrder?: SortOrderType,
  searchQuery?: string,
): Promise<PaginationResult<CardOutType>> {
  sortOrder = sortOrder || "asc";

  let results: PaginationResult<Doc<"cards">>;

  if (searchQuery) {
    results = await ctx.db
      .query("cards")
      .withSearchIndex("search_all", (q) => {
        if (deckId) {
          return q
            .search("searchableContent", searchQuery)
            .eq("deckId", deckId);
        } else {
          return q.search("searchableContent", searchQuery);
        }
      })
      // The order will be the order of the search results
      .paginate(paginationOpts);
  } else {
    results = await ctx.db
      .query("cards")
      .withIndex(
        "by_deck_id",
        (
          q: IndexRangeBuilder<Doc<"cards">, ["deckId", "_creationTime"], 0>,
        ) => {
          let q1;

          if (deckId) {
            q1 = q.eq("deckId", deckId);
          }

          return q1 || q;
        },
      )
      .order(sortOrder)
      .paginate(paginationOpts);
  }

  return {
    ...results,
    page: results.page.map((card) => ({
      _id: card._id,
      _creationTime: card._creationTime,
      deckId: card.deckId,
      userId: card.userId,
      front: card.front,
      back: card.back,
      // We don't need to send the searchableContent or embedding to the client
    })),
  };
}

/**
 * Get a card by its ID.
 */
export async function getCardById(
  ctx: QueryCtx,
  cardId: Id<"cards">,
): Promise<CardOutType> {
  const card = await ctx.db.get(cardId);
  if (!card) {
    throw new ConvexError({
      message: `Card ${cardId} not found`,
      code: 404,
    });
  }
  return {
    _id: card._id,
    _creationTime: card._creationTime,
    deckId: card.deckId,
    userId: card.userId,
    front: card.front,
    back: card.back,
    // We don't need to send the searchableContent or embedding to the client
  };
}

/**
 * Create a new card.
 */
export async function createCard(
  ctx: MutationCtx,
  data: CardInType,
  deckId: Id<"decks">,
  userId: Id<"users">,
): Promise<Id<"cards">> {
  const front = data.front || "";
  const back = data.back || "";
  const searchableContent = `${front.trim()} ${back.trim()}`;
  const cardId = await ctx.db.insert("cards", {
    ...data,
    deckId,
    userId,
    searchableContent,
  });

  // Schedule an action that embeds the card and updates the card.
  ctx.scheduler.runAfter(0, internal.openai_internals.getEmbedding, {
    text: searchableContent,
    cardId,
  });

  return cardId;
}

/**
 * Update a card with new front and back content.
 */
export async function updateCard(
  ctx: MutationCtx,
  cardId: Id<"cards">,
  data: CardUpdateType,
): Promise<void> {
  const card = await getCardById(ctx, cardId);
  const front = data.front || card.front || "";
  const back = data.back || card.back || "";
  const searchableContent = `${front.trim()} ${back.trim()}`;

  await ctx.db.patch(cardId, {
    ...data,
    searchableContent,
  });

  // If the content changed, update the embedding
  if (data.front || data.back) {
    ctx.scheduler.runAfter(0, internal.openai_internals.getEmbedding, {
      text: searchableContent,
      cardId,
    });
  }
}

/**
 * Delete a card.
 *
 * Does not update the card count of the deck.
 */
export async function deleteCard(
  ctx: MutationCtx,
  cardId: Id<"cards">,
): Promise<void> {
  await ctx.db.delete(cardId);
}

/**
 * Remove all cards in a deck.
 *
 * Returns the number of cards deleted.
 * Does not update the card count of the deck.
 */
export async function removeAllCardsInDeck(
  ctx: MutationCtx,
  deckId: Id<"decks">,
): Promise<number> {
  const cards = await ctx.db
    .query("cards")
    .withIndex("by_deck_id", (q) => q.eq("deckId", deckId))
    .collect();

  await Promise.all(cards.map((card) => deleteCard(ctx, card._id)));

  return cards.length;
}

/**
 * Remove all cards for a given user.
 *
 * Returns the number of cards deleted.
 */
export async function removeAllCardsForUser(
  ctx: MutationCtx,
  userId: Id<"users">,
): Promise<number> {
  const cards = await ctx.db
    .query("cards")
    .withIndex("by_user_id", (q) => q.eq("userId", userId))
    .collect();

  await Promise.all(cards.map((card) => deleteCard(ctx, card._id)));

  return cards.length;
}

/**
 * Get a sample of cards from a deck.
 *
 * Returns an array of card objects with front and back content.
 * The total number of characters in the front and back content of the cards
 * will not exceed the given maxChars.
 */
export async function getCardSamplesForContext(
  ctx: ActionCtx,
  deckId: Id<"decks">,
  maxChars: number = 10000,
): Promise<{ front: string; back?: string }[]> {
  try {
    // Assume getDeckById returns an object with cardCount or similar
    const deck = await ctx.runQuery(internal.decks_internals.getDeckById, {
      deckId,
    });
    const numCardsToFetch = deck?.cardCount || 100; // Fetch all or a reasonable max

    // Assume getAllCards takes pagination opts
    const paginatedCards = await ctx.runQuery(
      internal.cards_internals.getAllCards,
      {
        deckId,
        paginationOpts: { numItems: numCardsToFetch, cursor: null },
      },
    );
    const { page: cards } = paginatedCards;

    if (!cards || cards.length === 0) return [];

    let accumulatedChars = 0;
    const samples: { front: string; back?: string }[] = [];
    for (const card of cards) {
      const frontChars = card.front?.length || 0;
      const backChars = card.back?.length || 0;
      const cardChars = frontChars + backChars;
      if (accumulatedChars + cardChars > maxChars && samples.length > 0) {
        break;
      }
      samples.push({ front: card.front, back: card.back });
      accumulatedChars += cardChars;
    }
    return samples;
  } catch (error) {
    console.error(`Error fetching cards for deck ${deckId}:`, error);
    return [];
  }
}
