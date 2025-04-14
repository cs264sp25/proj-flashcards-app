type StudyProgressBarProps = {
  correct: number;
  incorrect: number;
  partial: number;
  skipped: number;
  totalCards: number;
  totalEvaluated: number;
};

const StudyProgressBar: React.FC<StudyProgressBarProps> = ({
  correct,
  incorrect,
  partial,
  skipped,
  totalCards,
  totalEvaluated,
}) => {
  // Calculate percentages for the progress bar
  const correctPercent = (correct / totalCards) * 100;
  const incorrectPercent = (incorrect / totalCards) * 100;
  const partialPercent = (partial / totalCards) * 100;
  const skippedPercent = (skipped / totalCards) * 100;
  const remainingPercent = ((totalCards - totalEvaluated) / totalCards) * 100;

  return (
    <div className="w-full h-2 bg-gray-100 dark:bg-gray-600 dark:bg-opacity-50 rounded-full overflow-hidden">
      <div className="flex h-full">
        <div
          className="bg-green-500 dark:bg-green-600 dark:bg-opacity-50"
          style={{ width: `${correctPercent}%` }}
          title={`Correct: ${correct}`}
        />
        <div
          className="bg-red-500 dark:bg-red-600 dark:bg-opacity-50"
          style={{ width: `${incorrectPercent}%` }}
          title={`Incorrect: ${incorrect}`}
        />
        <div
          className="bg-yellow-500 dark:bg-yellow-600 dark:bg-opacity-50"
          style={{ width: `${partialPercent}%` }}
          title={`Partial: ${partial}`}
        />
        <div
          className="bg-gray-300 dark:bg-gray-600 dark:bg-opacity-50"
          style={{ width: `${skippedPercent}%` }}
          title={`Skipped: ${skipped}`}
        />
        <div
          className="bg-gray-50 dark:bg-gray-600 dark:bg-opacity-50"
          style={{ width: `${remainingPercent}%` }}
          title="Remaining"
        />
      </div>
    </div>
  );
};

export default StudyProgressBar;
