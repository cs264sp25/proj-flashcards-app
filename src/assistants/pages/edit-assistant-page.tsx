import type { z } from "zod";
import { cn } from "@/core/lib/utils";
import { Separator } from "@/core/components/separator";
import { ScrollArea } from "@/core/components/scroll-area";
import Loading from "@/core/components/loading";
import Empty from "@/core/pages/empty";
import DeleteConfirmation from "@/core/components/delete-confirmation-dialog";
import { useRouter } from "@/core/hooks/use-router";

import EditAssistantForm from "@/assistants/components/edit-assistant-form";
import { createAssistantSchema } from "@/assistants/types/assistant";
import { useMutationAssistant } from "@/assistants/hooks/use-mutation-assistant";
import { useQueryAssistant } from "@/assistants/hooks/use-query-assistant";

const DEBUG = false;

interface EditAssistantPageProps {
  assistantId: string;
}

const EditAssistantPage: React.FC<EditAssistantPageProps> = ({
  assistantId,
}) => {
  const { navigate } = useRouter();
  const { data: assistant, loading, error } = useQueryAssistant(assistantId);
  const { edit: editAssistant, delete: deleteAssistant } =
    useMutationAssistant(assistantId);

  const handleSubmit = async (
    values: z.infer<typeof createAssistantSchema>,
  ) => {
    const success = await editAssistant(values);
    if (success) {
      navigate("assistants");
    }
  };

  const handleCancel = () => {
    navigate("assistants");
  };

  const handleDelete = async () => {
    const success = await deleteAssistant();
    if (success) {
      navigate("assistants");
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Empty message="Error loading assistant" />;
  }

  const initialValues = {
    name: assistant.name || "",
    description: assistant.description ?? undefined,
    instructions: assistant.instructions || "",
    model: assistant.model || "",
    temperature: assistant.temperature ?? undefined,
    tools: assistant.tools ?? [],
  };

  return (
    <ScrollArea
      className={cn("p-1 md:p-2 lg:p-4 h-full", {
        "border-2 border-red-500": DEBUG,
      })}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Edit Assistant</h2>
      </div>

      <EditAssistantForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        initialValues={initialValues}
        submitLabel="Save Changes"
        assistantId={assistantId}
      />

      <div className="relative my-4">
        <Separator />
        <span className="absolute inset-0 flex justify-center items-center px-2 text-sm">
          Or
        </span>
      </div>

      <div className="flex justify-center p-2">
        <DeleteConfirmation onDelete={handleDelete} name="Assistant" />
      </div>
    </ScrollArea>
  );
};

export default EditAssistantPage;
