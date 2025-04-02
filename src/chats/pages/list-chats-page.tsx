import { cn } from "@/core/lib/utils";
import { ScrollArea } from "@/core/components/scroll-area";
import { useRouter } from "@/core/hooks/use-router";
import { Button } from "@/core/components/button";
import { PlusCircle } from "lucide-react";

import ChatList from "@/chats/components/chat-list";

const DEBUG = false;

interface ListChatsPageProps {
  activeChatId?: string;
}

const ListChatsPage: React.FC<ListChatsPageProps> = ({ activeChatId }) => {
  const { navigate } = useRouter();

  return (
    <div
      className={cn("flex flex-col h-full", {
        "border-2 border-red-500": DEBUG,
      })}
    >
      <div
        className={cn("flex-none p-1 md:p-2 lg:p-4", {
          "border-2 border-blue-500": DEBUG,
        })}
      >
        <div
          className={cn("flex items-center justify-between", {
            "border-2 border-yellow-500": DEBUG,
          })}
        >
          <h2 className="text-2xl font-bold">Chats</h2>
          <Button variant="outline" size="sm" onClick={() => navigate("addChat")}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Chat
          </Button>
        </div>
      </div>
      <div
        className={cn("flex-1 min-h-0 p-1 md:p-2 lg:p-4", {
          "border-2 border-green-500": DEBUG,
        })}
      >
        <ChatList activeChatId={activeChatId} />
      </div>
    </div>
  );
};

export default ListChatsPage;
