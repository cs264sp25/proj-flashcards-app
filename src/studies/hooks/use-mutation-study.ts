import { api } from "@convex-generated/api";
import { Id } from "@convex-generated/dataModel";
import { useMutation } from "convex/react";
import { toast } from "sonner";

import { EvaluationStatus } from "@/studies/types/study";

export function useMutationStudy(studyId: string) {
  const recordEvaluationMutation = useMutation(api.studies_mutations.record);
  const completeStudyMutation = useMutation(api.studies_mutations.complete);
  const deleteMutation = useMutation(api.studies_mutations.remove);

  const recordEvaluation = async (
    cardId: Id<"cards">,
    status: EvaluationStatus,
  ): Promise<boolean> => {
    try {
      await recordEvaluationMutation({
        studyId: studyId as Id<"studies">,
        evaluation: {
          cardId,
          status,
          evaluatedAt: Date.now(),
        },
      });
      // This toast creates a poor UX
      // toast.success("Evaluation recorded successfully");
      return true;
    } catch (error) {
      toast.error((error as Error).message || "Please try again later");
      return false;
    }
  };

  const completeStudy = async (): Promise<boolean> => {
    try {
      await completeStudyMutation({
        studyId: studyId as Id<"studies">,
      });
      toast.success("Study completed successfully");
      return true;
    } catch (error) {
      toast.error((error as Error).message || "Please try again later");
      return false;
    }
  };

  const deleteStudy = async (): Promise<boolean> => {
    try {
      await deleteMutation({
        studyId: studyId as Id<"studies">,
      });
      toast.success("Study deleted successfully");
      return true;
    } catch (error) {
      toast.error((error as Error).message || "Please try again later");
      return false;
    }
  };

  return {
    record: recordEvaluation,
    complete: completeStudy,
    delete: deleteStudy,
  };
}
