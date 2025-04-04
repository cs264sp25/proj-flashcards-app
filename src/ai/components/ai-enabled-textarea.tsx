import { useState, useEffect } from "react";
import { Textarea } from "@/core/components/textarea";
import { useAiCompletion } from "@/ai/hooks/use-ai-completion";
import { Task, TaskType, CardContext } from "../types/tasks";
import { cn } from "@/core/lib/utils";
import { AiActions } from "./ai-actions";

interface AiEnabledTextareaProps {
  availableTasks?: TaskType[];
  placeholder?: string;
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
  cardContext?: CardContext;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

const AiEnabledTextarea: React.FC<AiEnabledTextareaProps> = ({
  availableTasks = ["improve", "simplify"], // Default tasks
  placeholder = "Type something...",
  className = "",
  value: externalValue,
  onChange: externalOnChange,
  cardContext,
  onKeyDown,
}) => {
  const [input, setInput] = useState<string>(externalValue || "");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { isLoading, error, generateCompletion } = useAiCompletion(setInput);

  // Update input when external value changes
  useEffect(() => {
    if (externalValue !== undefined) {
      setInput(externalValue);
    }
  }, [externalValue]);

  // Notify parent of input changes
  useEffect(() => {
    externalOnChange?.(input);
  }, [input, externalOnChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInput(newValue);
  };

  const handleTaskSelect = async (task: Task) => {
    setSelectedTask(task);
    // Extract context from cardContext if available
    const context = cardContext ? {
      front: cardContext.front,
      back: cardContext.back
    } : undefined;
    if (!input.trim()) {
      return; // Don't proceed if there's no input
    }
    await generateCompletion(input.trim(), task, context);
  };

  return (
    <div className="relative">
      <Textarea 
        value={input} 
        onChange={handleInputChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={cn(className, "pr-8")}
        disabled={isLoading}
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
