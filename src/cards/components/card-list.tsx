import { useState } from "react";
import { ArrowDown01, ArrowDown10 } from "lucide-react";
import { SortOrderType } from "convex/shared";

import { cn } from "@/core/lib/utils";
import Loading from "@/core/components/loading";
import Empty from "@/core/pages/empty";
import InfiniteScroll from "@/core/components/infinite-scroll";
import { SearchInput } from "@/core/components/search-input";
import { TooltipButton } from "@/core/components/tooltip-button";
import { ScrollArea } from "@/core/components/scroll-area";

import Card from "@/cards/components/card";
import { useQueryCards } from "@/cards/hooks/use-query-cards";

const DEBUG = false;

interface CardListProps {
  deckId: string;
  activeCardId?: string;
}

const CardList: React.FC<CardListProps> = ({ deckId, activeCardId }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState<SortOrderType>("desc");

  const {
    data: cards,
    loading,
    error,
    status,
    loadMore,
  } = useQueryCards(deckId, searchTerm, sort);

  const activeCard = cards.find((card) => card._id === activeCardId);

  if (error) {
    return <Empty message="Error loading cards" />;
  }

  return (
    <div
      className={cn("flex flex-col h-full", {
        "border-2 border-red-500": DEBUG,
      })}
    >
      <div
        className={cn("flex-none mb-4", {
          "border-2 border-blue-500": DEBUG,
        })}
      >
        <div
          className={cn("flex items-center gap-2", {
            "border-2 border-yellow-500": DEBUG,
          })}
        >
          <SearchInput
            onSearch={setSearchTerm}
            placeholder="Search cards"
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
      </div>

      <div
        className={cn("flex-1 min-h-0", {
          "border-2 border-green-500": DEBUG,
        })}
      >
        <ScrollArea className="h-full">
          <InfiniteScroll
            loadMore={loadMore}
            hasMore={status === "CanLoadMore"}
            isLoading={status === "LoadingMore"}
            aria-label="Card list"
            className="flex flex-col gap-2"
          >
            {activeCard && (
              <div
                className={cn("sticky top-0 z-10 pb-2 bg-background", {
                  "border-2 border-purple-500": DEBUG,
                })}
              >
                <Card
                  deckId={deckId}
                  _id={activeCard._id}
                  front={activeCard.front}
                  back={activeCard.back}
                  className="border-primary shadow-sm"
                />
              </div>
            )}

            {loading ? (
              <Loading />
            ) : cards.length === 0 ? (
              <Empty message="No cards in this deck yet. Add some to get started!" />
            ) : (
              cards
                .filter((card) => card._id !== activeCardId)
                .map((card) => (
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
        </ScrollArea>
      </div>
    </div>
  );
};

export default CardList;
