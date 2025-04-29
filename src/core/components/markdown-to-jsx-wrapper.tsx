import MarkdownToJSX, { RuleType } from "markdown-to-jsx";
import { cn } from "@/core/lib/utils";
import { InMarkdownDeck } from "@/decks/components/deck-in-markdown";
import { InMarkdownCard } from "@/cards/components/card-in-markdown";
import MermaidDiagram from "./mermaid-diagram";
import TeX from "@matejmazur/react-katex";
import StreamingPlaceholder from "./streaming-placeholder";
import CodeBlock from "./code-block";
import SyntaxHighlightedCode from "./syntax-highlighted-code";

interface MarkdownProps {
  content: string;
  className?: string;
  /** If true, custom components render as placeholders during streaming. */
  isStreaming?: boolean;
}

const Markdown: React.FC<MarkdownProps> = ({
  content,
  className,
  isStreaming = false,
}) => {
  return (
    <div
      className={cn("prose prose-stone prose-sm dark:prose-invert", className)}
    >
      <MarkdownToJSX
        options={{
          overrides: {
            code: SyntaxHighlightedCode,
            pre: CodeBlock,
            table: ({ children, ...props }) => (
              <div className="overflow-x-auto">
                <table className="table-auto" {...props}>
                  {children}
                </table>
              </div>
            ),
            InMarkdownDeck: ({ deckId }: { deckId: string }) =>
              isStreaming ? (
                <StreamingPlaceholder />
              ) : (
                <InMarkdownDeck deckId={deckId} />
              ),
            InMarkdownCard: ({ cardId }: { cardId: string }) =>
              isStreaming ? (
                <StreamingPlaceholder />
              ) : (
                <InMarkdownCard cardId={cardId} />
              ),
          },
          renderRule(next, node, renderChildren, state) {
            if (node.type === RuleType.codeBlock) {
              // Note: We might also want to add isStreaming check here for latex/mermaid if they are heavy.
              // For now, only custom components are handled.
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
