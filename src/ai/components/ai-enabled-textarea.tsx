import { useState, useEffect } from "react";
import { Textarea } from "@/core/components/textarea";
import { useAiCompletion } from "@/ai/hooks/use-ai-completion";
import { Task, inputDependentTasks } from "../types/tasks";
import { cn } from "@/core/lib/utils";
import { AiActions } from "./ai-actions";

interface AiEnabledTextareaProps {
  availableTasks?: Task[];
  placeholder?: string;
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
  context?: Record<string, string>;
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
  const { isLoading, error, generateCompletion } = useAiCompletion(setInput);

  useEffect(() => {
    if (externalValue) {
      if (externalValue !== input) {
        setInput(externalValue);
      }
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
    if (inputDependentTasks.has(task) && !input.trim()) {
      console.warn(
        `Task '${task}' requires text input, but the field is empty.`,
      );
      return;
    }

    await generateCompletion(input.trim(), task, context, customPrompt);
  };

  const hasInput = !!input.trim();
  const hasContextTasks = availableTasks.some(
    (task) => !inputDependentTasks.has(task),
  );
  const isTriggerEnabled = hasInput || hasContextTasks;

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
          isTriggerEnabled={isTriggerEnabled}
          hasInput={hasInput}
          onTaskSelect={handleTaskSelect}
        />
      </div>
      {error && <p className="mt-2 text-sm text-red-500">{error.message}</p>}
    </div>
  );
};

export default AiEnabledTextarea;
