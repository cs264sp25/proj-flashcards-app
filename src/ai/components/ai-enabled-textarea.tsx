import { useState, useEffect } from "react";
import { Textarea } from "@/core/components/textarea";
import { useAiCompletion } from "@/ai/hooks/use-ai-completion";
import { Task } from "../types/tasks";
import { cn } from "@/core/lib/utils";
import { AiActions } from "./ai-actions";

interface AiEnabledTextareaProps {
  availableTasks?: Task[];
  placeholder?: string;
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
  context?: Record<string, any>;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

const AiEnabledTextarea: React.FC<AiEnabledTextareaProps> = ({
  availableTasks = ["improve", "simplify"],
  placeholder = "Type something...",
  className = "",
  value: externalValue,
  onChange: externalOnChange,
  context,
  onKeyDown,
}) => {
  const [input, setInput] = useState<string>(externalValue || "");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { isLoading, error, generateCompletion } = useAiCompletion(setInput);

  useEffect(() => {
    if (externalValue !== undefined) {
      setInput(externalValue);
    }
  }, [externalValue]);

  useEffect(() => {
    externalOnChange?.(input);
  }, [input, externalOnChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInput(newValue);
  };

  const handleTaskSelect = async (task: Task, customPrompt?: string) => {
    setSelectedTask(task);
    if (!input.trim()) {
      return;
    }
    await generateCompletion(input.trim(), task, context, customPrompt);
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
      {error && <p className="mt-2 text-sm text-red-500">{error.message}</p>}
    </div>
  );
};

export default AiEnabledTextarea;
