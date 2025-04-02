import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { Textarea } from "@/core/components/textarea";
import { Button } from "@/core/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/core/components/dropdown-menu";
import { useAiCompletion } from "@/ai/hooks/use-ai-completion";
import { Task, TaskDescriptions } from "../types/tasks";
import { cn } from "@/core/lib/utils";

interface AiEnabledTextareaProps {
  availableTasks?: Task[];
  placeholder?: string;
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
}

const AiEnabledTextarea: React.FC<AiEnabledTextareaProps> = ({
  availableTasks = [Task.IMPROVE, Task.SIMPLIFY], // Default tasks
  placeholder = "Type something...",
  className = "",
  value: externalValue,
  onChange: externalOnChange,
}) => {
  const [input, setInput] = useState<string>(externalValue || "");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { completion, isLoading, error, generateCompletion } = useAiCompletion();

  // Update input when external value changes
  useEffect(() => {
    if (externalValue !== undefined) {
      setInput(externalValue);
    }
  }, [externalValue]);

  // Update input when completion changes
  useEffect(() => {
    if (completion) {
      setInput(completion);
      externalOnChange?.(completion);
    }
  }, [completion, externalOnChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInput(newValue);
    externalOnChange?.(newValue);
  };

  const handleTaskSelect = async (task: Task) => {
    setSelectedTask(task);
    await generateCompletion(input, task);
  };

  return (
    <div className="relative">
      <Textarea 
        value={input} 
        onChange={handleInputChange}
        placeholder={placeholder}
        className={cn(className, "pr-4")}
      />
      <div className="absolute top-2 right-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              disabled={isLoading || !input.trim()}
              className="h-8 w-8"
            >
              <Sparkles className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {availableTasks.map((task) => (
              <DropdownMenuItem
                key={task}
                onClick={() => handleTaskSelect(task)}
                disabled={isLoading}
              >
                {TaskDescriptions[task]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-500">{error.message}</p>
      )}
    </div>
  );
};

export default AiEnabledTextarea;
