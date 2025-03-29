import { useState } from "react";
import { ArrowDown01, ArrowDown10 } from "lucide-react";
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
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOrderType>("desc");
  const {
    data: cards,
    loading,
    error,
    status,
    loadMore,
  } = useQueryCards(deckId, sort);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Empty message="Error loading cards" />;
  }

  if (cards.length === 0) {
    return (
      <Empty message="No cards in this deck yet. Add some to get started!" />
    );
  }

  const handleSort = () => {
    setSort(sort === "asc" ? "desc" : "asc");
  };

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
      {cards.map((card) => (
        <div key={card._id} role="listitem">
          <Card
            deckId={deckId}
            _id={card._id}
            front={card.front}
            back={card.back}
          />
        </div>
      ))}
    </InfiniteScroll>
  );
};

export default CardList;
