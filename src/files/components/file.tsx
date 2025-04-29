import { cn } from "@/core/lib/utils";
import { Badge } from "@/core/components/badge";
import { Download, Edit } from "lucide-react";
import { useRouter } from "@/core/hooks/use-router";
import { TooltipButton } from "@/core/components/tooltip-button";
import { AspectRatio } from "@/core/components/aspect-ratio";

import { FileType } from "@/files/types/file";

const DEBUG = false;

export function File({
  _id,
  title,
  description,
  tags,
  _creationTime,
  url,
  className,
}: Partial<FileType> & { className?: string }) {
  const { navigate } = useRouter();

  return (
    <div
      className={cn(
        "w-full border rounded-xl p-2",
        "hover:bg-secondary",
        className,
        {
          "border-2 border-red-500": DEBUG,
        },
      )}
    >
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between shrink-0">
          <div
            className={cn("p-1 text-muted-foreground font-light text-sm", {
              "border-2 border-blue-500": DEBUG,
            })}
          >
            {_creationTime &&
              new Date(_creationTime).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "numeric",
              })}
          </div>
          <div
            className={cn("flex justify-end gap-1", {
              "border-2 border-blue-500": DEBUG,
            })}
          >
            <TooltipButton
              variant={"ghost"}
              size={"icon"}
              onClick={() => navigate("editFile", { fileId: _id })}
              tooltipContent="Edit file"
            >
              <Edit className="h-4 w-4" />
            </TooltipButton>
            <TooltipButton
              variant={"ghost"}
              size={"icon"}
              onClick={() => window.open(url, "_blank")}
              tooltipContent="Download file"
            >
              <Download className="h-4 w-4" />
            </TooltipButton>
          </div>
        </div>
        <div
          className={cn("p-1 font-medium truncate", {
            "border-2 border-green-500": DEBUG,
          })}
        >
          {title}
        </div>
        <div
          className={cn(
            "flex-1 p-1 text-muted-foreground text-sm line-clamp-2 overflow-hidden",
            {
              "border-2 border-green-500": DEBUG,
            },
          )}
        >
          {description}
        </div>
        <div
          className={cn("p-1 flex flex-wrap gap-1 overflow-hidden", {
            "border-2 border-green-500": DEBUG,
          })}
        >
          {tags?.map((tag, index) => (
            <Badge
              key={index}
              className="uppercase shrink-0"
              variant={"outline"}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

export default File;
