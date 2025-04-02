import MarkdownToJSX from "markdown-to-jsx";
import { cn } from "@/core/lib/utils";
import { InMarkdownDeck } from "@/decks/components/deck-in-markdown";
import { InMarkdownCard } from "@/cards/components/card-in-markdown";

interface MarkdownProps {
  content: string;
  className?: string;
}

const Markdown: React.FC<MarkdownProps> = ({ content, className }) => {
  return (
    <div
      className={cn("prose prose-stone prose-sm dark:prose-invert", className)}
    >
      <MarkdownToJSX
        options={{
          overrides: {
            InMarkdownDeck: ({ deckId }: { deckId: string }) => (
              <InMarkdownDeck deckId={deckId} />
            ),
            InMarkdownCard: ({ cardId }: { cardId: string }) => (
              <InMarkdownCard cardId={cardId} />
            ),
          },
        }}
        children={content}
      />
    </div>
  );
};

export default Markdown;
