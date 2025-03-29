import { Edit, MessageSquare } from "lucide-react";
import { cn } from "@/core/lib/utils";
import { AspectRatio } from "@/core/components/aspect-ratio";
import { useRouter } from "@/core/hooks/use-router";
import { TooltipButton } from "@/core/components/tooltip-button";
import { Badge } from "@/core/components/badge";

import { ChatType } from "@/chats/types/chat";

const DEBUG = false;

const Chat: React.FC<Partial<ChatType>> = ({
  _id,
  title,
  description,
  tags = [],
  messageCount = 0,
}) => {
  const { navigate } = useRouter();

  return (
    <AspectRatio
      ratio={16 / 9}
      className={cn("w-full border rounded-xl p-2", "hover:bg-secondary", {
        "border-2 border-red-500": DEBUG,
      })}
    >
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between shrink-0">
          <div
            className={cn("p-1 text-muted-foreground font-light text-sm", {
              "border-2 border-blue-500": DEBUG,
            })}
          >
            {messageCount}
            {messageCount == 1 ? " message" : " messages"}
          </div>
          <div
            className={cn("flex justify-end gap-1", {
              "border-2 border-blue-500": DEBUG,
            })}
          >
            <TooltipButton
              variant={"ghost"}
              size={"icon"}
              onClick={() => navigate("editChat", { chatId: _id })}
              tooltipContent="Edit chat"
            >
              <Edit className="h-4 w-4" />
            </TooltipButton>
            <TooltipButton
              variant={"ghost"}
              size={"icon"}
              onClick={() => navigate("messages", { chatId: _id })}
              tooltipContent="Show messages"
            >
              <MessageSquare className="h-4 w-4" />
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
          className={cn("flex-1 p-1 text-muted-foreground text-sm line-clamp-2 overflow-hidden", {
            "border-2 border-green-500": DEBUG,
          })}
        >
          {description}
        </div>
        <div
          className={cn("p-1 flex flex-wrap gap-1 overflow-hidden", {
            "border-2 border-green-500": DEBUG,
          })}
        >
          {tags?.map((tag, index) => (
            <Badge key={index} className="uppercase shrink-0" variant={"outline"}>
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </AspectRatio>
  );
};

export default Chat;
