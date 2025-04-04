export type TaskType = 
  | "grammar" 
  | "improve" 
  | "shorten" 
  | "lengthen" 
  | "simplify"
  | "frontToQuestion"
  | "questionImprove"
  | "answerConcise"
  | "answerComprehensive"
  | "answerStructure";

export interface CardContext {
  front: string;
  back: string;
  deckTitle?: string;
  deckDescription?: string;
  deckTags?: string[];
}

export interface CustomTask {
  system: string;
  user: (input: { text: string; context?: Record<string, any> }) => string;
}

export type Task = TaskType | CustomTask;

export const TaskDescriptions: Record<TaskType, string> = {
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
};
