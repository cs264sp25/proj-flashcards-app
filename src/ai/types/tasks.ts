export type TaskType = "grammar" | "improve" | "shorten" | "lengthen" | "simplify" | "professional";

export interface CustomTask {
  system: string;
  user: (text: string) => string;
}

export type Task = TaskType | CustomTask;

export const TaskDescriptions: Record<TaskType, string> = {
  grammar: "Fix grammar and spelling",
  improve: "Improve writing",
  shorten: "Make it shorter",
  lengthen: "Make it longer",
  simplify: "Simplify language",
  professional: "Make it professional",
};
