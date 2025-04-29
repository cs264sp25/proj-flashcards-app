import { PlusCircle } from "lucide-react";
import { cn } from "@/core/lib/utils";
import { useRouter } from "@/core/hooks/use-router";
import { Button } from "@/core/components/button";

import FileList from "@/files/components/file-list";

const DEBUG = false;

interface ListFilesPageProps {
  activeFileId?: string;
}

const ListFilesPage: React.FC<ListFilesPageProps> = ({ activeFileId }) => {
  const { navigate } = useRouter();

  return (
    <div
      className={cn("flex flex-col h-full", {
        "border-2 border-red-500": DEBUG,
      })}
    >
      <div
        className={cn("flex-none p-1 md:p-2 lg:p-4", {
          "border-2 border-blue-500": DEBUG,
        })}
      >
        <div
          className={cn("flex items-center justify-between", {
            "border-2 border-yellow-500": DEBUG,
          })}
        >
          <h2 className="text-2xl font-bold">Files</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("addFile")}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            New File
          </Button>
        </div>
      </div>
      <div
        className={cn("flex-1 min-h-0 p-1 md:p-2 lg:p-4", {
          "border-2 border-green-500": DEBUG,
        })}
      >
        <FileList activeFileId={activeFileId} />
      </div>
    </div>
  );
};

export default ListFilesPage;
