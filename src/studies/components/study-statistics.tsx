import { StudyStats } from "@/studies/types/study";

const StudyStatistics: React.FC<Partial<StudyStats>> = ({
  correct,
  incorrect,
  partial,
  skipped,
}) => {
  return (
    <div className="grid grid-cols-4 gap-2 text-sm">
      <div className="flex flex-col items-center p-2 rounded-lg bg-green-50 dark:bg-green-900 dark:bg-opacity-50">
        <span className="font-medium text-green-700 dark:text-green-200">
          {correct}
        </span>
        <span className="text-green-600 dark:text-green-200">Correct</span>
      </div>
      <div className="flex flex-col items-center p-2 rounded-lg bg-red-50 dark:bg-red-900 dark:bg-opacity-50">
        <span className="font-medium text-red-700 dark:text-red-200">
          {incorrect}
        </span>
        <span className="text-red-600 dark:text-red-200">Incorrect</span>
      </div>
      <div className="flex flex-col items-center p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-50">
        <span className="font-medium text-yellow-700 dark:text-yellow-200">
          {partial}
        </span>
        <span className="text-yellow-600 dark:text-yellow-200">Partial</span>
      </div>
      <div className="flex flex-col items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-900 dark:bg-opacity-50">
        <span className="font-medium text-gray-700 dark:text-gray-200">
          {skipped}
        </span>
        <span className="text-gray-600 dark:text-gray-200">Skipped</span>
      </div>
    </div>
  );
};

export default StudyStatistics;
