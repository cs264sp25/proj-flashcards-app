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

import Assistant from "@/assistants/components/assistant";
import { useQueryAssistants } from "@/assistants/hooks/use-query-assistants";

const DEBUG = false;

interface AssistantListProps {
  activeAssistantId?: string;
}

const AssistantList: React.FC<AssistantListProps> = ({ activeAssistantId }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState<SortOrderType>("desc");

  const {
    data: assistants,
    loading,
    error,
    status,
    loadMore,
  } = useQueryAssistants(searchTerm, sort);

  const activeAssistant = assistants.find(
    (assistant) => assistant._id === activeAssistantId,
  );

  if (error) {
    return <Empty message="Error loading assistants" />;
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
            placeholder="Search assistants"
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
            aria-label="Chat list"
            className="flex flex-col gap-2"
          >
            {activeAssistant && (
              <div
                className={cn("sticky top-0 z-10 pb-2 bg-background", {
                  "border-2 border-purple-500": DEBUG,
                })}
              >
                <Assistant
                  {...activeAssistant}
                  className="border-primary shadow-sm"
                />
              </div>
            )}

            {loading ? (
              <Loading />
            ) : assistants.length === 0 ? (
              <Empty message="No assistants found. Create one to get started!" />
            ) : (
              assistants
                .filter((assistant) => assistant._id !== activeAssistantId)
                .map(({ _id, name, description, model }) => (
                  <div key={_id} role="listitem">
                    <Assistant
                      _id={_id}
                      name={name}
                      description={description}
                      model={model}
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

export default AssistantList;
