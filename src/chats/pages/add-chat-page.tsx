import { cn } from "@/core/lib/utils";
import type { z } from "zod";
import { useRouter } from "@/core/hooks/use-router";
import { ScrollArea } from "@/core/components/scroll-area";

import ChatForm from "@/chats/components/chat-form";
import { formSchema } from "@/chats/config/form-config";
import { useMutationChats } from "@/chats/hooks/use-mutation-chats";

const DEBUG = false;

const AddChatPage: React.FC = () => {
  const { navigate } = useRouter();
  const { add: createChat } = useMutationChats();

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    const chatId = await createChat(values);
    if (chatId) {
      navigate("messages", { chatId });
    }
  };

  const handleCancel = () => {
    navigate("chats");
  };

  return (
    <ScrollArea
      className={cn("p-1 md:p-2 lg:p-4 h-full", {
        "border-2 border-red-500": DEBUG,
      })}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Add New Chat</h2>
      </div>

      <ChatForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitLabel="Create Chat"
      />
    </ScrollArea>
  );
};

export default AddChatPage;
