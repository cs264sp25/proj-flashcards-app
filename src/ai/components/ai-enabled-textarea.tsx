import { useState, useEffect } from "react";
import { Textarea } from "@/core/components/textarea";
import { useAiCompletion } from "@/ai/hooks/use-ai-completion";
import { Task, TaskType } from "../types/tasks";
import { cn } from "@/core/lib/utils";
import { AiActions } from "./ai-actions";

interface AiEnabledTextareaProps {
  availableTasks?: TaskType[];
  placeholder?: string;
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
}

const AiEnabledTextarea: React.FC<AiEnabledTextareaProps> = ({
  availableTasks = ["improve", "simplify"], // Default tasks
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
        <AiActions
          availableTasks={availableTasks}
          isLoading={isLoading}
          hasInput={!!input.trim()}
          onTaskSelect={handleTaskSelect}
        />
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-500">{error.message}</p>
      )}
    </div>
  );
};

export default AiEnabledTextarea;
