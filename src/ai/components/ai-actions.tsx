import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/core/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/core/components/dropdown-menu";
import { CustomPromptDialog } from "./custom-prompt-dialog";
import { Task, TaskDescriptions, inputDependentTasks } from "../types/tasks";

interface AiActionsProps {
  availableTasks: Task[];
  isLoading: boolean;
  isTriggerEnabled: boolean;
  hasInput: boolean;
  onTaskSelect: (task: Task, customPrompt?: string) => void;
}

export const AiActions = ({
  availableTasks,
  isLoading,
  isTriggerEnabled,
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
          disabled={!isTriggerEnabled || isLoading}
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
        {availableTasks
          .filter((task) => task !== "custom")
          .map((task) => {
            const isItemDisabled =
              isLoading || (!hasInput && inputDependentTasks.has(task));

            return (
              <DropdownMenuItem
                key={task}
                onClick={() => {
                  onTaskSelect(task);
                  setIsDropdownOpen(false);
                }}
                disabled={isItemDisabled}
              >
                {TaskDescriptions[task]}
              </DropdownMenuItem>
            );
          })}
        <CustomPromptDialog
          setDropdownOpen={setIsDropdownOpen}
          onTaskSelect={onTaskSelect}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
