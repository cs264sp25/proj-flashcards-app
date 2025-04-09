import { api } from "@convex-generated/api";
import { Id } from "@convex-generated/dataModel";
import { useMutation } from "convex/react";
import { toast } from "sonner";

import { UpdateAssistantType } from "@/assistants/types/assistant";

export function useMutationAssistant(assistantId: string) {
  const updateMutation = useMutation(api.assistants_mutations.update);
  const deleteMutation = useMutation(api.assistants_mutations.remove);

  const editAssistant = async (
    assistant: UpdateAssistantType,
  ): Promise<boolean> => {
    try {
      await updateMutation({
        ...assistant,
        assistantId: assistantId as Id<"assistants">,
      });
      toast.success("Assistant updated successfully");
      return true;
    } catch (error) {
      toast.error("Error updating assistant", {
        description: (error as Error).message || "Please try again later",
      });
      return false;
    }
  };

  const deleteAssistant = async (): Promise<boolean> => {
    try {
      await deleteMutation({
        assistantId: assistantId as Id<"assistants">,
      });
      toast.success("Assistant deleted successfully");
      return true;
    } catch (error) {
      toast.error("Error deleting assistant", {
        description: (error as Error).message || "Please try again later",
      });
      return false;
    }
  };

  return {
    edit: editAssistant,
    delete: deleteAssistant,
  };
}
