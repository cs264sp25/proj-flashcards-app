import { useState } from "react";
import { ArrowDown01, ArrowDown10 } from "lucide-react";
import Loading from "@/core/components/loading";
import Empty from "@/core/pages/empty";
import InfiniteScroll from "@/core/components/infinite-scroll";

import { Deck } from "./deck";
import { useQueryDecks } from "@/decks/hooks/use-query-decks";
import { Input } from "@/core/components/input";
import { TooltipButton } from "@/core/components/tooltip-button";
import { SortOrderType } from "convex/shared";

const DeckList: React.FC = () => {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOrderType>("desc");
  const { data: decks, loading, error, status, loadMore } = useQueryDecks(
    sort,
  );

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Empty message="Error loading decks" />;
  }

  if (decks.length === 0) {
    return <Empty message="No decks found. Create one to get started!" />;
  }

  const handleSort = () => {
    setSort(sort === "asc" ? "desc" : "asc");
  };

  return (
    <InfiniteScroll
      loadMore={loadMore}
      hasMore={status === "CanLoadMore"}
      isLoading={status === "LoadingMore"}
      aria-label="Deck list"
      className="flex flex-col gap-2"
    >
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full"
        />
        <TooltipButton
          variant="outline"
          size="icon"
          onClick={handleSort}
          tooltipContent="Sort"
        >
          {sort === "asc" ? (
            <ArrowDown01 className="h-4 w-4" />
          ) : (
            <ArrowDown10 className="h-4 w-4" />
          )}
        </TooltipButton>
      </div>
      {decks.map(({ _id, title, description, cardCount, tags }) => (
        <div key={_id} role="listitem">
          <Deck
            _id={_id}
            title={title}
            description={description}
            cardCount={cardCount || 0}
            tags={tags || []}
          />
        </div>
      ))}
    </InfiniteScroll>
  );
};

export default DeckList;
