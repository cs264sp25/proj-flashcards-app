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
  | "generateTagsFromCards";

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
};
