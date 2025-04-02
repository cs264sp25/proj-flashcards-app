import { useQueryCard } from "@/cards/hooks/use-query-card";
import Card from "./card";

interface InMarkdownCardProps {
  cardId: string;
}

export function InMarkdownCard({ cardId }: InMarkdownCardProps) {
  const { data: card, loading, error } = useQueryCard(cardId);

  if (loading) {
    return <div className="animate-pulse bg-secondary rounded-xl h-[200px]" />;
  }

  if (error || !card) {
    return <div className="text-destructive">Failed to load card</div>;
  }

  return <Card {...card} mode="flip" />;
}
