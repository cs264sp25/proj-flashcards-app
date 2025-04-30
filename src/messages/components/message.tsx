import React, { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/core/components/avatar";
import {
  BotMessageSquare,
  User2,
  Copy,
  Edit,
  RefreshCw,
  Check,
  Volume2,
} from "lucide-react";
import { cn } from "@/core/lib/utils";
import { useQueryUser } from "@/auth/hooks/use-query-user";
import { Button } from "@/core/components/button";
import Markdown from "@/core/components/markdown";
import { MessageType } from "@/messages/types/message";
import { AutosizeTextarea } from "@/core/components/autoresize-textarea";
import { useMutationMessage } from "@/messages/hooks/use-mutation-message";
import { useQueryMessages } from "@/messages/hooks/use-query-messages";
import { toast } from "sonner";
import { AudioPlayer } from "@/core/components/audio-player";

const DEBUG = false;

interface MessageProps {
  message: MessageType;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const { data: user } = useQueryUser();
  const isAssistant = message.role === "assistant";
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [messageContent, setMessageContent] = useState(message.content);
  const { edit, read } = useMutationMessage(message._id);
  const { getMessageBefore } = useQueryMessages(message.chatId);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const shouldAutoPlayRef = useRef(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEdit = async () => {
    await edit({ content: messageContent });
    setIsEditing(false);
  };

  const handleRegenerate = async () => {
    const previousMessage = getMessageBefore(message._id);
    if (!previousMessage) {
      return;
    }

    await edit(
      {
        content: previousMessage.content,
      },
      previousMessage._id,
    );
  };

  const handleReadAloud = async () => {
    try {
      setIsLoadingAudio(true);
      shouldAutoPlayRef.current = true;
      const url = await read();
      if (!url) {
        // If we got null, it means the audio is being generated
        // The UI will update automatically when the message updates
        return;
      }
    } catch (error) {
      toast.error("Failed to generate audio");
    } finally {
      setIsLoadingAudio(false);
    }
  };

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
            {message.audioUrl ? (
              <AudioPlayer
                url={message.audioUrl}
                autoPlay={shouldAutoPlayRef.current}
                onEnded={() => {
                  shouldAutoPlayRef.current = false;
                }}
              />
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleReadAloud}
                disabled={isLoadingAudio}
              >
                {isLoadingAudio ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8 transition-colors", {
                "text-primary": copied,
              })}
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>

            {isAssistant ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleRegenerate}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            ) : !isEditing ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setIsEditing(true);
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </div>

        <div
          className={cn("mt-0.5 text-foreground", {
            "border-2 border-yellow-500": DEBUG,
          })}
        >
          {isEditing ? (
            <div className="mt-2">
              <AutosizeTextarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                className="resize-y w-full h-full"
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button size={"sm"} variant={"secondary"} onClick={handleEdit}>
                  Save
                </Button>
                <Button
                  size={"sm"}
                  variant={"outline"}
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Markdown content={messageContent} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;
