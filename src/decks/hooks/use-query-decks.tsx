import { api } from "@convex-generated/api";
import { usePaginatedQuery } from "convex/react";

import { DeckType } from "@/decks/types/deck";

const INITIAL_NUM_ITEMS = 5;
const LOAD_MORE_NUM_ITEMS = 5;

export function useQueryDecks(
  initialNumItems: number = INITIAL_NUM_ITEMS,
  loadMoreNumItems: number = LOAD_MORE_NUM_ITEMS,
) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.decks.getAll,
    {},
    { initialNumItems },
  );

  return {
    data: results as DeckType[],
    loading: status === "LoadingFirstPage",
    error: results === null,
    status,
    loadMore: () => loadMore(loadMoreNumItems),
  };
}
