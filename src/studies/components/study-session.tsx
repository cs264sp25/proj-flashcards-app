import { useState } from "react";
import { cn } from "@/core/lib/utils";
import { Id } from "@convex-generated/dataModel";
import { Button } from "@/core/components/button";
import { Card } from "@/core/components/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/core/components/alert-dialog";

import { useMutationStudy } from "@/studies/hooks/use-mutation-study";
import { EvaluationStatus } from "@/studies/types/study";
import { StudyProgress } from "@/studies/components/study-progress";
import Markdown from "@/core/components/markdown";

interface StudySessionProps {
  studyId: Id<"studies">;
  cards: Array<{
    _id: Id<"cards">;
    front: string;
    back: string;
  }>;
  onComplete?: () => void;
}

export const StudySession: React.FC<StudySessionProps> = ({
  studyId,
  cards,
  onComplete,
}) => {
  // State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [evaluations, setEvaluations] = useState<Array<{ status: EvaluationStatus }>>([]);

  // Mutations
  const { record: recordEvaluation, complete: completeStudy } = useMutationStudy(studyId);

  // Current card
  const currentCard = cards[currentIndex];
  const isLastCard = currentIndex === cards.length - 1;
  const isFirstCard = currentIndex === 0;
  
  // Check if current card has been evaluated
  const currentCardEvaluated = evaluations[currentIndex]?.status !== undefined;
  
  // Find the first unevaluated card index
  const firstUnevaluatedIndex = evaluations.length;
  
  // Navigation controls
  const canMoveNext = currentIndex < firstUnevaluatedIndex - 1 || currentCardEvaluated;

  // Calculate remaining cards
  const remainingCards = cards.length - evaluations.length;

  // Handlers
  const handleFlip = () => {
    if (!currentCardEvaluated) {
      setIsFlipped(!isFlipped);
    }
  };

  const handleEvaluation = async (status: EvaluationStatus) => {
    if (currentCardEvaluated) return;

    const success = await recordEvaluation(currentCard._id, status);
    if (!success) return;

    // Add the evaluation
    const newEvaluations = [...evaluations];
    newEvaluations[currentIndex] = { status };
    setEvaluations(newEvaluations);

    // Automatically move to next card if not the last one
    if (!isLastCard) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      // Complete the study if this was the last card
      const completed = await completeStudy();
      if (completed) {
        onComplete?.();
      }
    }
  };

  const handleSkip = async () => {
    if (currentCardEvaluated) return;
    await handleEvaluation("skipped");
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleNext = () => {
    if (canMoveNext && currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handleCompleteSession = async () => {
    // Skip all remaining cards
    for (let i = evaluations.length; i < cards.length; i++) {
      const success = await recordEvaluation(cards[i]._id, "skipped");
      if (!success) return;

      const newEvaluations = [...evaluations];
      newEvaluations[i] = { status: "skipped" };
      setEvaluations(newEvaluations);
    }

    // Complete the study
    const completed = await completeStudy();
    if (completed) {
      onComplete?.();
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6 w-full max-w-2xl mx-auto">
      {/* Progress component */}
      <StudyProgress
        currentIndex={currentIndex}
        totalCards={cards.length}
        evaluations={evaluations}
      />

      {/* Navigation buttons */}
      <div className="w-full flex justify-between items-center">
        <Button
          variant="ghost"
          onClick={handlePrevious}
          disabled={isFirstCard}
        >
          Previous
        </Button>
        <Button
          variant="ghost"
          onClick={handleNext}
          disabled={!canMoveNext || isLastCard}
        >
          Next
        </Button>
      </div>

      {/* Card display */}
      <Card
        className={cn(
          "w-full aspect-[3/2] cursor-pointer transition-all duration-300",
          {
            "hover:shadow-lg": !currentCardEvaluated,
          },
        )}
        onClick={handleFlip}
      >
        <div className="p-6 h-full flex items-center justify-center text-lg">
          <Markdown content={isFlipped ? currentCard.back : currentCard.front} />
        </div>
      </Card>

      {/* Action buttons */}
      <div className="flex flex-col space-y-2 w-full">
        {isFlipped && !currentCardEvaluated && (
          <div className="flex justify-center space-x-2">
            <Button
              variant="destructive"
              onClick={() => handleEvaluation("incorrect")}
            >
              Incorrect
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleEvaluation("partial")}
            >
              Partial
            </Button>
            <Button
              variant="default"
              onClick={() => handleEvaluation("correct")}
            >
              Correct
            </Button>
          </div>
        )}
        {!currentCardEvaluated && (
          <Button variant="ghost" onClick={handleSkip}>
            Skip
          </Button>
        )}
        {currentCardEvaluated && (
          <div className="text-center text-sm text-muted-foreground">
            {isLastCard ? "Study session complete!" : "Card evaluated - use navigation to continue"}
          </div>
        )}
      </div>

      {/* Complete Session section */}
      {remainingCards > 0 && (
        <div className="w-full mt-4 pt-4 border-t">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full"
              >
                Complete Session ({remainingCards} cards remaining)
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Complete Study Session?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will mark all remaining cards ({remainingCards}) as skipped and end your study session. 
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleCompleteSession}>
                  Complete Session
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
};
