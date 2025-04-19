import MarkdownToJSX, { RuleType } from "markdown-to-jsx";
import { cn } from "@/core/lib/utils";
import { InMarkdownDeck } from "@/decks/components/deck-in-markdown";
import { InMarkdownCard } from "@/cards/components/card-in-markdown";
import MermaidDiagram from "./mermaid-diagram";
import TeX from "@matejmazur/react-katex";

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
          renderRule(next, node, renderChildren, state) {
            if (node.type === RuleType.codeBlock) {
              if (node.lang === "latex") {
                return (
                  <TeX as="div" key={state.key}>{String.raw`${node.text}`}</TeX>
                );
              }

              if (node.lang === "mermaid") {
                return <MermaidDiagram code={node.text} />;
              }
            }

            return next();
          },
        }}
        children={content}
      />
    </div>
  );
};

export default Markdown;
