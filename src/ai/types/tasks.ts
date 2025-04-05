export type Task =
  | "grammar"
  | "improve"
  | "shorten"
  | "lengthen"
  | "simplify"
  | "frontToQuestion"
  | "questionImprove"
  | "answerConcise"
  | "answerComprehensive"
  | "answerStructure"
  | "custom"
  | "generateTitleFromCards"
  | "generateDescriptionFromCards"
  | "generateTagsFromCards"
  | "generateTitleFromMessages"
  | "generateDescriptionFromMessages"
  | "generateTagsFromMessages";

export const TaskDescriptions: Record<Task, string> = {
  grammar: "Fix grammar and spelling",
  improve: "Improve writing",
  shorten: "Make it shorter",
  lengthen: "Make it longer",
  simplify: "Simplify language",
  frontToQuestion: "Convert to question",
  questionImprove: "Improve question",
  answerConcise: "Make answer concise",
  answerComprehensive: "Make answer comprehensive",
  answerStructure: "Structure answer better",
  custom: "Custom instruction...",
  generateTitleFromCards: "Generate title from cards",
  generateDescriptionFromCards: "Generate description from cards",
  generateTagsFromCards: "Generate tags from cards",
  generateTitleFromMessages: "Generate title from messages",
  generateDescriptionFromMessages: "Generate description from messages",
  generateTagsFromMessages: "Generate tags from messages",
};

// Define which tasks MANDATE input text to function meaningfully
// Tasks not listed here might use input if available, but can also work from context.
export const inputDependentTasks: Set<Task> = new Set<Task>([
  "grammar",
  "improve",
  "shorten",
  "lengthen",
  "simplify",
  "questionImprove",
  "answerConcise",
  "answerComprehensive",
  "answerStructure",
  "custom",
]);
