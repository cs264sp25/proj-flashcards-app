import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/core/components/avatar";
import { BotMessageSquare, User2 } from "lucide-react";
import { cn } from "@/core/lib/utils";
import { useQueryUser } from "@/auth/hooks/use-query-user";
import Markdown from "@/core/components/markdown";
import { MessageType } from "@/messages/types/message";

const DEBUG = false;

interface MessageProps {
  message: MessageType;
}

const StreamingMessage: React.FC<MessageProps> = ({ message }) => {
  const { data: user } = useQueryUser();
  const isAssistant = message.role === "assistant";
  const [messageContent, setMessageContent] = useState(message.content);

  useEffect(() => {
    setMessageContent(message.content);
  }, [message.content]);

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-2 group hover:bg-accent/50 transition-colors",
        {
          "border-2 border-red-500": DEBUG,
        },
      )}
      role="listitem"
    >
      <div
        className={cn("flex-shrink-0", {
          "border-2 border-blue-500": DEBUG,
        })}
      >
        <Avatar className="w-9 h-9">
          {isAssistant ? (
            <AvatarFallback className="bg-primary/10">
              <BotMessageSquare className="w-5 h-5 text-primary" />
            </AvatarFallback>
          ) : (
            <>
              <AvatarImage src={user?.image} />
              <AvatarFallback className="bg-secondary">
                <User2 className="w-5 h-5 text-secondary-foreground" />
              </AvatarFallback>
            </>
          )}
        </Avatar>
      </div>

      <div
        className={cn("flex-1 min-w-0", {
          "border-2 border-green-500": DEBUG,
        })}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">
              {isAssistant ? "Assistant" : user?.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(message._creationTime).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Keep this in case we need it later! */}
          </div>
        </div>

        <div
          className={cn("mt-0.5 text-foreground", {
            "border-2 border-yellow-500": DEBUG,
          })}
        >
          <Markdown
            content={messageContent}
            className="prose-base"
            isStreaming={true}
          />
        </div>
      </div>
    </div>
  );
};

export default StreamingMessage;
