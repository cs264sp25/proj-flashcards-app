import { cn } from "@/core/lib/utils";
import { useRouter } from "@/core/hooks/use-router";
import { Button } from "@/core/components/button";
import { PlusCircle } from "lucide-react";

import AssistantList from "@/assistants/components/assistant-list";

const DEBUG = false;

interface ListAssistantsPageProps {
  activeAssistantId?: string;
}

const ListAssistantsPage: React.FC<ListAssistantsPageProps> = ({
  activeAssistantId,
}) => {
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
          <h2 className="text-2xl font-bold">Assistants</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("addAssistant")}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            New Assistant
          </Button>
        </div>
      </div>
      <div
        className={cn("flex-1 min-h-0 p-1 md:p-2 lg:p-4", {
          "border-2 border-green-500": DEBUG,
        })}
      >
        <AssistantList activeAssistantId={activeAssistantId} />
      </div>
    </div>
  );
};

export default ListAssistantsPage;
