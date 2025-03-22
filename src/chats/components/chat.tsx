import { Edit, MessageSquare } from "lucide-react";
import { cn } from "@/core/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/core/components/tooltip";
import { AspectRatio } from "@/core/components/aspect-ratio";
import { useRouter } from "@/core/hooks/use-router";
import { Button } from "@/core/components/button";
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
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between">
          <div
            className={cn("p-1 text-muted-foreground font-light text-sm", {
              "border-2 border-blue-500": DEBUG,
            })}
          >
            {messageCount}
            {messageCount == 1 ? " message" : " messages"}
          </div>
          <div
            className={cn("flex justify-end", {
              "border-2 border-blue-500": DEBUG,
            })}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={"ghost"}
                  size={"icon"}
                  onClick={() => navigate("editChat", { chatId: _id })}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit chat</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={"ghost"}
                  size={"icon"}
                  onClick={() => navigate("messages", { chatId: _id })}
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Show messages</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        <div
          className={cn("p-1", {
            "border-2 border-green-500": DEBUG,
          })}
        >
          {title}
        </div>
        <div
          className={cn("flex-1 p-1 text-muted-foreground", {
            "border-2 border-green-500": DEBUG,
          })}
        >
          {description}
        </div>
        <div
          className={cn("p-1", {
            "border-2 border-green-500": DEBUG,
          })}
        >
          {tags?.map((tag, index) => (
            <Badge key={index} className="mr-1" variant={"outline"}>
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </AspectRatio>
  );
};

export default Chat;
