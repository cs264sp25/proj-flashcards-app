import { cn } from "@/core/lib/utils";
import type { z } from "zod";
import { useRouter } from "@/core/hooks/use-router";
import { ScrollArea } from "@/core/components/scroll-area";

import AddAssistantForm from "@/assistants/components/add-assistant-form";
import { createAssistantSchema } from "@/assistants/types/assistant";
import { useMutationAssistants } from "@/assistants/hooks/use-mutation-assistants";

const DEBUG = false;

const AddAssistantPage: React.FC = () => {
  const { navigate } = useRouter();
  const { add: createAssistant } = useMutationAssistants();

  const handleSubmit = async (
    values: z.infer<typeof createAssistantSchema>,
  ) => {
    const assistantId = await createAssistant(values);
    if (assistantId) {
      navigate("assistants", { assistantId });
    }
  };

  const handleCancel = () => {
    navigate("assistants");
  };

  return (
    <ScrollArea
      className={cn("p-1 md:p-2 lg:p-4 h-full", {
        "border-2 border-red-500": DEBUG,
      })}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Add New Assistant</h2>
      </div>

      <AddAssistantForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitLabel="Create Assistant"
      />
    </ScrollArea>
  );
};

export default AddAssistantPage;
