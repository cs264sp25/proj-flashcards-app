import { api } from "@convex-generated/api";
import { Id } from "@convex-generated/dataModel";
import { useQuery } from "convex/react";

import { StudyType } from "@/studies/types/study";

export function useQueryStudy(studyId: string) {
  const study = useQuery(api.studies_queries.getOne, {
    studyId: studyId as Id<"studies">,
  });

  return {
    data: study as StudyType,
    loading: study === undefined,
    error: study === null,
  };
}
