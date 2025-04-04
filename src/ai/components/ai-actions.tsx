import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/core/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/core/components/dropdown-menu";
import { CustomPromptDialog } from "./custom-prompt-dialog";
import { TaskType, Task, TaskDescriptions } from "../types/tasks";

interface AiActionsProps {
  availableTasks: TaskType[];
  isLoading: boolean;
  hasInput: boolean;
  onTaskSelect: (task: Task) => void;
}

export const AiActions = ({
  availableTasks,
  isLoading,
  hasInput,
  onTaskSelect,
}: AiActionsProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={isLoading || !hasInput}
          className="h-8 w-8"
          onClick={() => setIsDropdownOpen(true)}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {availableTasks.map((task) => (
          <DropdownMenuItem
            key={task}
            onClick={() => {
              onTaskSelect(task);
              setIsDropdownOpen(false);
            }}
            disabled={isLoading}
          >
            {TaskDescriptions[task]}
          </DropdownMenuItem>
        ))}
        <CustomPromptDialog setDropdownOpen={setIsDropdownOpen} onTaskSelect={onTaskSelect} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}; 