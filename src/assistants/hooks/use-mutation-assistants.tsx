import { api } from "@convex-generated/api";
import { useMutation } from "convex/react";
import { toast } from "sonner";

import { CreateAssistantType } from "@/assistants/types/assistant";

export function useMutationAssistants() {
  const createMutation = useMutation(api.assistants_mutations.create);

  const createAssistant = async (
    assistant: CreateAssistantType,
  ): Promise<string | null> => {
    try {
      const assistantId = await createMutation({
        ...assistant,
      });
      toast.success("Assistant created successfully");
      return assistantId as string;
    } catch (error) {
      toast.error("Error creating assistant", {
        description: (error as Error).message || "Please try again later",
      });
      return null;
    }
  };

  return {
    add: createAssistant,
  };
}
