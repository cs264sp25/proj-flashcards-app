import { api } from "@convex-generated/api";
import { usePaginatedQuery } from "convex/react";
import { SortOrderType } from "convex/shared";

import { AssistantType } from "@/assistants/types/assistant";

const INITIAL_NUM_ITEMS = 5;
const LOAD_MORE_NUM_ITEMS = 5;

export function useQueryAssistants(
  searchQuery?: string,
  sortOrder: SortOrderType = "desc",
  initialNumItems: number = INITIAL_NUM_ITEMS,
  loadMoreNumItems: number = LOAD_MORE_NUM_ITEMS,
) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.assistants_queries.getAll,
    { sortOrder, searchQuery },
    { initialNumItems },
  );

  return {
    data: results as AssistantType[],
    loading: status === "LoadingFirstPage",
    error: results === null,
    status,
    loadMore: () => loadMore(loadMoreNumItems),
  };
}
