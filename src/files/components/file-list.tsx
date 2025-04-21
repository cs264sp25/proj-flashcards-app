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

import File from "@/files/components/file";
import { useQueryFiles } from "@/files/hooks/use-query-files";

const DEBUG = false;

interface FileListProps {
  activeFileId?: string;
}

const FileList: React.FC<FileListProps> = ({ activeFileId }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState<SortOrderType>("desc");

  const {
    data: files,
    loading,
    error,
    status,
    loadMore,
  } = useQueryFiles(searchTerm, sort);

  const activeFile = files.find((file) => file._id === activeFileId);

  if (error) {
    return <Empty message="Error loading files" />;
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
            placeholder="Search files"
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
            aria-label="File list"
            className="flex flex-col gap-2"
          >
            {activeFile && (
              <div
                className={cn("sticky top-0 z-10 pb-2 bg-background", {
                  "border-2 border-purple-500": DEBUG,
                })}
              >
                <File {...activeFile} className="border-primary shadow-sm" />
              </div>
            )}

            {loading ? (
              <Loading />
            ) : files.length === 0 ? (
              <Empty message="No files found. Create one to get started!" />
            ) : (
              files
                .filter((file) => file._id !== activeFileId)
                .map(({ _id, title, description, tags, _creationTime, url }) => (
                  <div key={_id} role="listitem">
                    <File
                      _id={_id}
                      title={title}
                      description={description}
                      tags={tags}
                      _creationTime={_creationTime}
                      url={url}
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

export default FileList;
