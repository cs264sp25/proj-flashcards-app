import { cn } from "@/core/lib/utils";
import { ScrollArea } from "@/core/components/scroll-area";

import StudyList from "@/studies/components/study-list";

const DEBUG = false;

const ListStudiesPage: React.FC = () => {
  return (
    <ScrollArea
      className={cn("p-1 md:p-2 lg:p-4 h-full", {
        "border-2 border-red-500": DEBUG,
      })}
    >
      <div
        className={cn("flex items-center justify-between mb-6", {
          "border-2 border-blue-500": DEBUG,
        })}
      >
        <h2
          className={cn("text-2xl font-bold", {
            "border-2 border-green-500": DEBUG,
          })}
        >
          Study Sessions
        </h2>
      </div>
      <div className="flex items-center gap-2 text-sm mb-4">
        These are your past study sessions. To start a new study session, go to
        the deck you want to study and click the "Study" (📖) button.
      </div>
      <StudyList />
    </ScrollArea>
  );
};

export default ListStudiesPage;
