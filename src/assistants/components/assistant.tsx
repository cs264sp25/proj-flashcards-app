import { Edit } from "lucide-react";
import { cn } from "@/core/lib/utils";
import { AspectRatio } from "@/core/components/aspect-ratio";
import { useRouter } from "@/core/hooks/use-router";
import { TooltipButton } from "@/core/components/tooltip-button";

import { AssistantType } from "@/assistants/types/assistant";

const DEBUG = false;

const Assistant: React.FC<Partial<AssistantType> & { className?: string }> = ({
  _id,
  name,
  description,
  model,
  className,
}) => {
  const { navigate } = useRouter();

  return (
    <AspectRatio
      ratio={16 / 9}
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
            {model}
          </div>
          <div
            className={cn("flex justify-end gap-1", {
              "border-2 border-blue-500": DEBUG,
            })}
          >
            <TooltipButton
              variant={"ghost"}
              size={"icon"}
              onClick={() => navigate("editAssistant", { assistantId: _id })}
              tooltipContent="Edit assistant"
            >
              <Edit className="h-4 w-4" />
            </TooltipButton>
          </div>
        </div>
        <div
          className={cn("p-1 font-medium truncate", {
            "border-2 border-green-500": DEBUG,
          })}
        >
          {name}
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
      </div>
    </AspectRatio>
  );
};

export default Assistant;
