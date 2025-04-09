import { api } from "@convex-generated/api";
import { Id } from "@convex-generated/dataModel";
import { useQuery } from "convex/react";

import { AssistantType } from "@/assistants/types/assistant";

export function useQueryAssistant(assistantId: string) {
  const assistant = useQuery(api.assistants_queries.getOne, {
    assistantId: assistantId as Id<"assistants">,
  });

  return {
    data: assistant as AssistantType,
    loading: assistant === undefined,
    error: assistant === null,
  };
}
