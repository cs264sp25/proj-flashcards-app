import type { z } from "zod";
import { cn } from "@/core/lib/utils";
import { Separator } from "@/core/components/separator";
import { ScrollArea } from "@/core/components/scroll-area";
import Loading from "@/core/components/loading";
import Empty from "@/core/pages/empty";
import DeleteConfirmation from "@/core/components/delete-confirmation-dialog";
import { useRouter } from "@/core/hooks/use-router";

import EditFileForm from "@/files/components/edit-file-form";
import { createFileSchema } from "@/files/types/file";
import { useMutationFile } from "@/files/hooks/use-mutation-file";
import { useQueryFile } from "@/files/hooks/use-query-file";

const DEBUG = false;

interface EditFilePageProps {
  fileId: string;
}

const EditFilePage: React.FC<EditFilePageProps> = ({ fileId }) => {
  const { navigate } = useRouter();
  const { data: file, loading, error } = useQueryFile(fileId);
  const { edit: editFile, delete: deleteFile } = useMutationFile(fileId);

  const handleSubmit = async (values: z.infer<typeof createFileSchema>) => {
    const success = await editFile(values);
    if (success) {
      navigate("files");
    }
  };

  const handleCancel = () => {
    navigate("files");
  };

  const handleDelete = async () => {
    const success = await deleteFile();
    if (success) {
      navigate("files");
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (error || !file) {
    return <Empty message="Error loading file or file not found" />;
  }

  const initialValues = {
    title: file.title || "",
    description: file.description || "",
    tags: file.tags || [],
  };

  return (
    <ScrollArea
      className={cn("p-1 md:p-2 lg:p-4 h-full", {
        "border-2 border-red-500": DEBUG,
      })}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Edit File</h2>
      </div>

      <EditFileForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        initialValues={initialValues}
        submitLabel="Save Updates"
        fileId={file._id}
      />

      <div className="relative my-4">
        <Separator />
        <span className="absolute inset-0 flex justify-center items-center px-2 text-sm">
          Or
        </span>
      </div>

      <div className="flex justify-center p-2">
        <DeleteConfirmation onDelete={handleDelete} name="File" />
      </div>
    </ScrollArea>
  );
};

export default EditFilePage;
