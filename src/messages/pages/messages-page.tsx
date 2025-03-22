import React from "react";
import MessageList from "@/messages/components/message-list";
import MessageInput from "@/messages/components/message-input";
import { cn } from "@/core/lib/utils";

const DEBUG = false;

interface MessagesProps {
  chatId: string;
}

const MessagesPage: React.FC<MessagesProps> = ({ chatId }) => {
  return (
    <div
      className={cn("flex flex-col h-full p-4 bg-background", {
        "border-2 border-red-500": DEBUG,
      })}
    >
      <div
        className={cn("flex-1 overflow-auto mb-4", {
          "border-2 border-blue-500": DEBUG,
        })}
      >
        <MessageList chatId={chatId} />
      </div>
      <MessageInput chatId={chatId} />
    </div>
  );
};

export default MessagesPage;
