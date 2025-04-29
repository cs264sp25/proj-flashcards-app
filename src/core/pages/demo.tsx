import { useState } from "react";
import { useAction } from "convex/react";
import { useAuthToken } from "@convex-dev/auth/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/core/components/button";
import AiEnabledTextareaDemo from "@/ai/page/ai-enabled-textarea-demo";
import { ScrollArea } from "@/core/components/scroll-area";
import { TooltipButton } from "../components/tooltip-button";
import { Copy } from "lucide-react";
import { cn } from "../lib/utils";
import { toast } from "sonner";

const DEBUG = false;

const DemoPage = () => {
  const token = useAuthToken();
  const [data, setData] = useState<string | null>(null);
  const act = useAction(api.hello.greet);

  const handleCopyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token).then(() => {
        toast.success("Token copied to clipboard!");
      });
    }
  };

  return (
    <ScrollArea className="h-full p-4">
      <div className="flex flex-col gap-4 max-w-lg mx-auto">
        <h2 className="text-xl">Demo Page</h2>
        <div className="m-2">
          <div>Auth Token:</div>
          <div
            className={cn(
              "flex flex-col items-center",
              "mx-auto overflow-auto border rounded-md",
              {
                "border border-red-500": DEBUG,
                "border-primary": !DEBUG,
              },
            )}
            style={{ maxWidth: "100%" }}
          >
            <div
              className={cn("flex justify-end items-center w-full p-1", {
                "border border-blue-500": DEBUG,
              })}
            >
              <TooltipButton
                variant="ghost"
                size={"icon"}
                onClick={handleCopyToken}
                tooltipContent={"Copy token"}
              >
                <Copy />
              </TooltipButton>
            </div>
            <pre
              className={cn("text-wrap px-4 pb-1 whitespace-pre-wrap", {
                "border border-green-500": DEBUG,
              })}
              style={{
                maxWidth: "100%",
                overflowWrap: "break-word",
                wordWrap: "break-word",
              }}
            >
              {token}
            </pre>
          </div>
        </div>
        <div>
          <div className="flex gap-2 items-center">
            <Button
              onClick={() => {
                act().then(setData);
              }}
            >
              Click me to invoke a Python function
            </Button>
            <Button variant={"secondary"} onClick={() => setData("")}>
              Clear
            </Button>
          </div>
          {data && (
            <div className="m-2">
              <div>Server says:</div>
              <pre className="text-wrap mx-auto overflow-auto border rounded-md px-4 py-2 border-primary">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="mt-4">
          <AiEnabledTextareaDemo />
        </div>
      </div>
    </ScrollArea>
  );
};

export default DemoPage;
