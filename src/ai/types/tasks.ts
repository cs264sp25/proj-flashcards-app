export enum Task {
  GRAMMAR = "grammar",
  IMPROVE = "improve",
  SHORTEN = "shorten",
  LENGTHEN = "lengthen",
  SIMPLIFY = "simplify",
  PROFESSIONAL = "professional",
}

export const TaskDescriptions: Record<Task, string> = {
  [Task.GRAMMAR]: "Fix spelling & grammar",
  [Task.IMPROVE]: "Improve writing",
  [Task.SHORTEN]: "Make shorter",
  [Task.LENGTHEN]: "Make longer",
  [Task.SIMPLIFY]: "Simplify language",
  [Task.PROFESSIONAL]: "Change to professional tone",
};
