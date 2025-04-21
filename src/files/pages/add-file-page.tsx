import { cn } from "@/core/lib/utils";
import type { z } from "zod";
import { useRouter } from "@/core/hooks/use-router";
import { ScrollArea } from "@/core/components/scroll-area";

import AddFileForm from "@/files/components/add-file-form";
import { createFileSchema } from "@/files/types/file";
import { useMutationFiles } from "@/files/hooks/use-mutation-files";

const DEBUG = false;

const AddFilePage: React.FC = () => {
  const { navigate } = useRouter();
  const { add: createFile } = useMutationFiles();

  const handleSubmit = async (values: z.infer<typeof createFileSchema>) => {
    const fileId = await createFile(values);
    if (fileId) {
      navigate("files");
    }
  };

  const handleCancel = () => {
    navigate("files");
  };

  return (
    <ScrollArea
      className={cn("p-1 md:p-2 lg:p-4 h-full", {
        "border-2 border-red-500": DEBUG,
      })}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Add New File</h2>
      </div>

      <AddFileForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitLabel="Create File"
      />
    </ScrollArea>
  );
};

export default AddFilePage;
