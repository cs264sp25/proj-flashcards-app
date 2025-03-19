import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/core/lib/utils";

interface MarkdownProps {
  content: string;
  className?: string;
}

const Markdown: React.FC<MarkdownProps> = ({ content, className }) => {
  return (
    <div
      className={cn("prose prose-stone prose-sm dark:prose-invert", className)}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[]}
        children={content}
        components={{}}
      />
    </div>
  );
};

export default Markdown;
