import { api } from "@convex-generated/api";
import { Id } from "@convex-generated/dataModel";
import { useMutation } from "convex/react";
import { toast } from "sonner";

import { CreateStudyType } from "@/studies/types/study";

export function useMutationStudies() {
  const createMutation = useMutation(api.studies_mutations.create);

  const createStudy = async (
    study: CreateStudyType,
  ): Promise<string | null> => {
    const { deckId, ...rest } = study;
    try {
      const studyId = await createMutation({
        ...rest,
        deckId: deckId as Id<"decks">,
      });
      toast.success("Study created successfully");
      return studyId as string;
    } catch (error) {
      toast.error((error as Error).message || "Please try again later");
      return null;
    }
  };

  return {
    add: createStudy,
  };
}
