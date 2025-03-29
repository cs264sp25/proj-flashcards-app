import { useState } from "react";
import { ArrowDown01, ArrowDown10 } from "lucide-react";
import { useDebounce } from "@uidotdev/usehooks";
import Loading from "@/core/components/loading";
import Empty from "@/core/pages/empty";
import InfiniteScroll from "@/core/components/infinite-scroll";

import Card from "@/cards/components/card";
import { useQueryCards } from "@/cards/hooks/use-query-cards";
import { Input } from "@/core/components/input";
import { TooltipButton } from "@/core/components/tooltip-button";
import { SortOrderType } from "convex/shared";

interface CardListProps {
  deckId: string;
}

const CardList: React.FC<CardListProps> = ({ deckId }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState<SortOrderType>("desc");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const {
    data: cards,
    loading,
    error,
    status,
    loadMore,
  } = useQueryCards(deckId, debouncedSearchTerm, sort);

  if (error) {
    return <Empty message="Error loading cards" />;
  }

  return (
    <InfiniteScroll
      loadMore={loadMore}
      hasMore={status === "CanLoadMore"}
      isLoading={status === "LoadingMore"}
      aria-label="Card list"
      className="flex flex-col gap-2"
    >
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
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
      ) : cards.length === 0 ? (
        <Empty message="No cards in this deck yet. Add some to get started!" />
      ) : (
        cards.map((card) => (
          <div key={card._id} role="listitem">
            <Card
              deckId={deckId}
              _id={card._id}
              front={card.front}
              back={card.back}
            />
          </div>
        ))
      )}
    </InfiniteScroll>
  );
};

export default CardList;
