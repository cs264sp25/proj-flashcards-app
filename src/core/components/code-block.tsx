import { cn } from "@/core/lib/utils";
import { Button } from "@/core/components/button";
import { useState } from "react";
import { Copy, WrapText, Text, Check } from "lucide-react";

const DEBUG = false;

interface CodeBlockProps extends React.HTMLAttributes<HTMLElement> {
  className?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = (props) => {
  const [copied, setCopied] = useState(false);
  const [wrap, setWrap] = useState(false);

  const handleCopy = async () => {
    // Find the actual code content from the pre element's children
    const codeElement = props.children as React.ReactElement<{
      children?: React.ReactNode;
    }>;
    const codeContent = codeElement?.props?.children || "";

    await navigator.clipboard.writeText(String(codeContent));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("mt-2 not-prose", { "border border-green-500": DEBUG })}>
      <div
        className={cn(
          "flex items-center justify-end gap-1",
          "p-1 px-3",
          "border-b-0 rounded-t-lg",
          "bg-foreground text-background/80",
          "dark:bg-muted dark:text-foreground/80",
          {
            "border border-red-500": DEBUG,
          },
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-6",
            "hover:bg-foreground/90 hover:text-background/90",
            "hover:dark:bg-muted/30 hover:dark:text-foreground/90",
            {
              "border border-blue-500": DEBUG,
            },
          )}
          onClick={() => setWrap(!wrap)}
          title={wrap ? "Unwrap" : "Wrap"}
        >
          {wrap ? <Text size={16} /> : <WrapText size={16} />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-6",
            "hover:bg-foreground/90 hover:text-background/90",
            "hover:dark:bg-muted/30 hover:dark:text-foreground/90",
            {
              "border border-blue-500": DEBUG,
            },
          )}
          onClick={handleCopy}
          title={copied ? "Copied!" : "Copy"}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </Button>
      </div>
      <pre {...props} style={{ whiteSpace: wrap ? "pre-wrap" : "pre" }} />
    </div>
  );
};

export default CodeBlock;
