import type { z } from "zod";
import { cn } from "@/core/lib/utils";
import { Separator } from "@/core/components/separator";
import { ScrollArea } from "@/core/components/scroll-area";
import Loading from "@/core/components/loading";
import Empty from "@/core/pages/empty";
import DeleteConfirmation from "@/core/components/delete-confirmation-dialog";
import { useRouter } from "@/core/hooks/use-router";

import EditChatForm from "@/chats/components/edit-chat-form";
import { createChatSchema } from "@/chats/types/chat";
import { useMutationChat } from "@/chats/hooks/use-mutation-chat";
import { useQueryChat } from "@/chats/hooks/use-query-chat";

const DEBUG = false;

interface EditChatPageProps {
  chatId: string;
}

const EditChatPage: React.FC<EditChatPageProps> = ({ chatId }) => {
  const { navigate } = useRouter();
  const { data: chat, loading, error } = useQueryChat(chatId);
  const { edit: editChat, delete: deleteChat } = useMutationChat(chatId);

  const handleSubmit = async (values: z.infer<typeof createChatSchema>) => {
    const success = await editChat(values);
    if (success) {
      navigate("chats");
    }
  };

  const handleCancel = () => {
    navigate("chats");
  };

  const handleDelete = async () => {
    const success = await deleteChat();
    if (success) {
      navigate("chats");
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (error || !chat) {
    return <Empty message="Error loading chat or chat not found" />;
  }

  const initialValues = {
    title: chat.title || "",
    description: chat.description || "",
    tags: chat.tags || [],
  };

  return (
    <ScrollArea
      className={cn("p-1 md:p-2 lg:p-4 h-full", {
        "border-2 border-red-500": DEBUG,
      })}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Edit Chat</h2>
      </div>

      <EditChatForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        initialValues={initialValues}
        submitLabel="Save Changes"
      />

      <div className="relative my-4">
        <Separator />
        <span className="absolute inset-0 flex justify-center items-center px-2 text-sm">
          Or
        </span>
      </div>

      <div className="flex justify-center p-2">
        <DeleteConfirmation onDelete={handleDelete} name="Chat" />
      </div>
    </ScrollArea>
  );
};

export default EditChatPage;
