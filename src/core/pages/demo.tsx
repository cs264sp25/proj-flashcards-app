import { useState } from "react";
import { useAction } from "convex/react";
import { useAuthToken } from "@convex-dev/auth/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/core/components/button";
import AiEnabledTextareaDemo from "@/ai/page/ai-enabled-textarea-demo";
import { ScrollArea } from "@/core/components/scroll-area";

const DemoPage = () => {
  const token = useAuthToken();
  const [data, setData] = useState<string | null>(null);
  const act = useAction(api.hello.greet);

  return (
    <ScrollArea className="h-full p-4">
      <div className="flex flex-col gap-4 max-w-lg mx-auto">
        <h2 className="text-xl">Demo Page</h2>
        <div className="m-2">
          <div>Auth Token:</div>
          <pre className="text-wrap mx-auto overflow-auto border rounded-md px-4 py-2 border-primary">
            {token}
          </pre>
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
