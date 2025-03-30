import { useState } from "react";
import { ArrowDown01, ArrowDown10 } from "lucide-react";
import { SortOrderType } from "convex/shared";

import Loading from "@/core/components/loading";
import Empty from "@/core/pages/empty";
import InfiniteScroll from "@/core/components/infinite-scroll";
import { SearchInput } from "@/core/components/search-input";
import { TooltipButton } from "@/core/components/tooltip-button";

import { Deck } from "@/decks/components/deck";
import { useQueryDecks } from "@/decks/hooks/use-query-decks";

const DeckList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState<SortOrderType>("desc");

  const {
    data: decks,
    loading,
    error,
    status,
    loadMore,
  } = useQueryDecks(searchTerm, sort);

  if (error) {
    return <Empty message="Error loading decks" />;
  }

  return (
    <InfiniteScroll
      loadMore={loadMore}
      hasMore={status === "CanLoadMore"}
      isLoading={status === "LoadingMore"}
      aria-label="Deck list"
      className="flex flex-col gap-2"
    >
      <div className="flex items-center gap-2">
        <SearchInput
          onSearch={setSearchTerm}
          placeholder="Search decks"
          className="flex-1"
        />
        <TooltipButton
          variant="outline"
          size="icon"
          onClick={() => setSort(sort === "asc" ? "desc" : "asc")}
          tooltipContent="Sort"
        >
          {sort === "asc" ? (
            <ArrowDown01 className="h-4 w-4" />
          ) : (
            <ArrowDown10 className="h-4 w-4" />
          )}
        </TooltipButton>
      </div>
      {loading ? (
        <Loading />
      ) : decks.length === 0 ? (
        <Empty message="No decks found. Create one to get started!" />
      ) : (
        decks.map(({ _id, title, description, cardCount, tags }) => (
          <div key={_id} role="listitem">
            <Deck
              _id={_id}
              title={title}
              description={description}
              cardCount={cardCount || 0}
              tags={tags || []}
            />
          </div>
        ))
      )}
    </InfiniteScroll>
  );
};

export default DeckList;
