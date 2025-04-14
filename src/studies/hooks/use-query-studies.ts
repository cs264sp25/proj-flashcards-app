import { api } from "@convex-generated/api";
import { usePaginatedQuery } from "convex/react";
import { SortOrderType } from "convex/shared";

import { StudyType } from "@/studies/types/study";

const INITIAL_NUM_ITEMS = 10;
const LOAD_MORE_NUM_ITEMS = 5;

export function useQueryStudies(
  sortOrder: SortOrderType = "desc",
  initialNumItems: number = INITIAL_NUM_ITEMS,
  loadMoreNumItems: number = LOAD_MORE_NUM_ITEMS,
) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.studies_queries.getAll,
    { sortOrder },
    { initialNumItems },
  );

  return {
    data: results as StudyType[],
    loading: status === "LoadingFirstPage",
    error: results === null,
    status,
    loadMore: () => loadMore(loadMoreNumItems),
  };
}
