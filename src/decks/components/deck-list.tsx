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

import { Deck } from "@/decks/components/deck";
import { useQueryDecks } from "@/decks/hooks/use-query-decks";

const DEBUG = false;

interface DeckListProps {
  activeDeckId?: string;
}

const DeckList: React.FC<DeckListProps> = ({ activeDeckId }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState<SortOrderType>("desc");

  const {
    data: decks,
    loading,
    error,
    status,
    loadMore,
  } = useQueryDecks(searchTerm, sort);

  const activeDeck = decks.find((deck) => deck._id === activeDeckId);

  if (error) {
    return <Empty message="Error loading decks" />;
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
            aria-label="Deck list"
            className="flex flex-col gap-2"
          >
            {activeDeck && (
              <div
                className={cn("sticky top-0 z-10 pb-2 bg-background", {
                  "border-2 border-purple-500": DEBUG,
                })}
              >
                <Deck {...activeDeck} className="border-primary shadow-sm" />
              </div>
            )}

            {loading ? (
              <Loading />
            ) : decks.length === 0 ? (
              <Empty message="No decks found. Create one to get started!" />
            ) : (
              decks
                .filter((deck) => deck._id !== activeDeckId)
                .map(({ _id, title, description, cardCount, tags }) => (
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
        </ScrollArea>
      </div>
    </div>
  );
};

export default DeckList;
