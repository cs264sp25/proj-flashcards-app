import { useState, useMemo } from "react";
import AiEnabledTextarea from "../components/ai-enabled-textarea";
import { Textarea } from "@/core/components/textarea";
import { Label } from "@/core/components/label";
import { Task } from "../types/tasks";

// All tasks extracted from convex/prompts.ts
const allTasks: Task[] = [
  "grammar",
  "improve",
  "simplify",
  "shorten",
  "lengthen",
  "frontToQuestion",
  "questionImprove",
  "answerConcise",
  "answerComprehensive",
  "answerStructure",
  "custom",
  // --- Card Generation Tasks ---
  // These tasks require specific context (like deckId) which might not be
  // easily provided in this generic demo. They are included for completeness
  // but might not function fully without proper context setup.
  "generateTitleFromCards",
  "generateDescriptionFromCards",
  "generateTagsFromCards",
  // --- Chat Generation Tasks ---
  // Similar to card generation tasks, these require specific context (like chatId)
  "generateTitleFromMessages",
  "generateDescriptionFromMessages",
  "generateTagsFromMessages",
];

const AiEnabledTextareaDemo: React.FC = () => {
  const [value, setValue] = useState("");
  const [contextValue, setContextValue] = useState("");
  const [contextError, setContextError] = useState<string | null>(null);

  const context = useMemo(() => {
    const trimmedContext = contextValue.trim();
    if (!trimmedContext) {
      setContextError(null);
      return undefined;
    }
    try {
      const parsedContext = JSON.parse(trimmedContext);
      if (
        typeof parsedContext === "object" &&
        parsedContext !== null &&
        !Array.isArray(parsedContext)
      ) {
        setContextError(null);
        const stringifiedContext: Record<string, string> = {};
        for (const key in parsedContext) {
          if (Object.prototype.hasOwnProperty.call(parsedContext, key)) {
            stringifiedContext[key] = String(parsedContext[key]);
          }
        }
        return stringifiedContext;
      } else {
        setContextError("Context must be a valid JSON object.");
        return undefined;
      }
    } catch (error) {
      setContextError("Invalid JSON format in context textarea.");
      return undefined;
    }
  }, [contextValue]);

  return (
    <div className="space-y-4 p-4 border rounded-md">
      <h3 className="text-lg font-semibold">AI Enabled Textarea Demo</h3>
      <div className="grid w-full gap-1.5">
        <Label htmlFor="ai-textarea">AI Textarea</Label>
        <AiEnabledTextarea
          value={value}
          onChange={setValue}
          placeholder="Enter text and use the AI actions..."
          availableTasks={allTasks}
          context={context}
          className="min-h-[100px]"
        />
      </div>
      <div className="grid w-full gap-1.5">
        <Label htmlFor="context-textarea">Additional Context (Optional)</Label>
        <Textarea
          id="context-textarea"
          placeholder="Provide additional context for AI tasks here..."
          value={contextValue}
          onChange={(e) => setContextValue(e.target.value)}
          className="min-h-[80px]"
        />
        <p className="text-sm text-muted-foreground">
          Context provided here should be valid JSON (e.g., {'{"key": "value"}'}
          ) and will be parsed before sending to the AI.
        </p>
        {contextError && <p className="text-sm text-red-500">{contextError}</p>}
      </div>
    </div>
  );
};

export default AiEnabledTextareaDemo;
