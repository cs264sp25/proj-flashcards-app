import { useQueryDeck } from "@/decks/hooks/use-query-deck";
import { Deck } from "./deck";

interface InMarkdownDeckProps {
  deckId: string;
}

export function InMarkdownDeck({ deckId }: InMarkdownDeckProps) {
  const { data: deck, loading, error } = useQueryDeck(deckId);

  if (loading) {
    return <div className="animate-pulse bg-secondary rounded-xl h-[200px]" />;
  }

  if (error || !deck) {
    return <div className="text-destructive">Failed to load deck</div>;
  }

  return <Deck {...deck} />;
} 