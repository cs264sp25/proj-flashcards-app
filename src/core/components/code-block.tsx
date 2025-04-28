import { cn } from "@/core/lib/utils";
import { Button } from "@/core/components/button";
import { useState } from "react";

const DEBUG = false;

interface CodeBlockProps extends React.HTMLAttributes<HTMLElement> {
  className?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = (props) => {
  const [copied, setCopied] = useState(false);
  const [wrap, setWrap] = useState(false);

  const handleCopy = async () => {
    // Find the actual code content from the pre element's children
    const codeElement = props.children as React.ReactElement;
    const codeContent = codeElement?.props?.children || "";

    await navigator.clipboard.writeText(codeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("mt-2 not-prose", { "border border-green-500": DEBUG })}>
      <div
        className={cn(
          "flex items-center justify-end gap-1 p-1 px-3 bg-foreground dark:bg-muted border-b-0 rounded-t-lg",
          {
            "border border-red-500": DEBUG,
          },
        )}
      >
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-6 hover:bg-muted/30", {
            "border border-blue-500": DEBUG,
          })}
          onClick={() => setWrap(!wrap)}
        >
          <span className="text-xs font-extralight text-muted dark:text-muted-foreground">
            {wrap ? "Unwrap" : "Wrap"}
          </span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 hover:bg-muted/30"
          onClick={handleCopy}
        >
          <span className="text-xs font-extralight text-muted dark:text-muted-foreground">
            {copied ? "Copied!" : "Copy"}
          </span>
        </Button>
      </div>
      <pre {...props} style={{ whiteSpace: wrap ? "pre-wrap" : "pre" }} />
    </div>
  );
};

export default CodeBlock;
