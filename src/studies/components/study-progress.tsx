import { cn } from "@/core/lib/utils";

import { EvaluationStatus } from "@/studies/types/study";
import StudyStatistics from "@/studies/components/study-statistics";
import StudyProgressBar from "@/studies/components/study-progress-bar";

export interface StudyProgressProps {
  currentIndex: number;
  totalCards: number;
  evaluations: Array<{
    status: EvaluationStatus;
  }>;
}

export const StudyProgress: React.FC<StudyProgressProps> = ({
  currentIndex,
  totalCards,
  evaluations,
}) => {
  // Calculate statistics
  const totalEvaluated = evaluations.length;
  const correct = evaluations.filter((e) => e.status === "correct").length;
  const incorrect = evaluations.filter((e) => e.status === "incorrect").length;
  const partial = evaluations.filter((e) => e.status === "partial").length;
  const skipped = evaluations.filter((e) => e.status === "skipped").length;

  return (
    <div className="w-full space-y-4">
      {/* Card count and progress */}
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">
          Card {currentIndex + 1} of {totalCards}
        </span>
        <span className="text-sm text-muted-foreground">
          {totalEvaluated} evaluated
        </span>
      </div>

      {/* Progress bar */}
      <StudyProgressBar
        correct={correct}
        incorrect={incorrect}
        partial={partial}
        skipped={skipped}
        totalCards={totalCards}
        totalEvaluated={totalEvaluated}
      />

      {/* Statistics */}
      <StudyStatistics
        correct={correct}
        incorrect={incorrect}
        partial={partial}
        skipped={skipped}
      />

      {/* Progress circles */}
      <div className="flex gap-1 justify-center">
        {evaluations.map((evaluation, index) => (
          <div
            key={index}
            className={cn("w-2 h-2 rounded-full", {
              "bg-green-500 dark:bg-green-600": evaluation.status === "correct",
              "bg-red-500 dark:bg-red-600": evaluation.status === "incorrect",
              "bg-yellow-500 dark:bg-yellow-600":
                evaluation.status === "partial",
              "bg-gray-300 dark:bg-gray-600 dark:bg-opacity-50":
                evaluation.status === "skipped",
            })}
            title={`Card ${index + 1}: ${evaluation.status}`}
          />
        ))}
        {[...Array(totalCards - totalEvaluated)].map((_, index) => (
          <div
            key={`remaining-${index}`}
            className="w-2 h-2 rounded-full bg-gray-100 dark:bg-gray-600 dark:bg-opacity-50"
            title={`Card ${totalEvaluated + index + 1}: Not evaluated`}
          />
        ))}
      </div>
    </div>
  );
};
