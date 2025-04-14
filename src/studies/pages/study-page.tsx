import { cn } from "@/core/lib/utils";
import { Id } from "@convex-generated/dataModel";
import Loading from "@/core/components/loading";
import { ScrollArea } from "@/core/components/scroll-area";
import Empty from "@/core/pages/empty";
import { useRouter } from "@/core/hooks/use-router";

import { useQueryStudyCards } from "@/studies/hooks/use-query-study-cards";
import { useQueryStudy } from "@/studies/hooks/use-query-study";
import { StudySession } from "@/studies/components/study-session";

const DEBUG = false;

interface StudyPageProps {
  studyId: string;
}

const StudyPage: React.FC<StudyPageProps> = ({ studyId }) => {
  const { navigate } = useRouter();
  const { data: study, loading: studyLoading, error: studyError } = useQueryStudy(studyId as Id<"studies">);
  const { data: cards, loading: cardsLoading, error: cardsError } = useQueryStudyCards(study?.deckId);

  const handleComplete = () => {
    navigate("decks");
  };

  // Handle loading states
  if (studyLoading || cardsLoading) {
    return <Loading />;
  }

  // Handle error states
  if (studyError || !study) {
    return <Empty message="Error loading study session" />;
  }

  if (cardsError || !cards) {
    return <Empty message="Error loading cards" />;
  }

  if (cards.length === 0) {
    return <Empty message="There are no cards to study!" />;
  }

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
          Study Session
        </h2>
      </div>
      <div
        className={cn("flex flex-col w-[95%] mx-auto", {
          "border-2 border-yellow-500": DEBUG,
        })}
      >
        <StudySession
          studyId={studyId as Id<"studies">}
          cards={cards.map((card) => ({
            _id: card._id as Id<"cards">,
            front: card.front,
            back: card.back,
          }))}
          onComplete={handleComplete}
        />
      </div>
    </ScrollArea>
  );
};

export default StudyPage;
