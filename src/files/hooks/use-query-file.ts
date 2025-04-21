import { api } from "@convex-generated/api";
import { Id } from "@convex-generated/dataModel";
import { useQuery } from "convex/react";

import { FileType } from "@/files/types/file";

export function useQueryFile(fileId: string) {
  const file = useQuery(api.files_queries.getOne, {
    fileId: fileId as Id<"files">,
  });

  return {
    data: file as unknown as FileType,
    loading: file === undefined,
    error: file === null,
  };
}
