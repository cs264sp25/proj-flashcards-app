import { useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import { api } from "../convex/_generated/api";
import { useState } from "react";

function App() {
  const [showMessage, setShowMessage] = useState(false);
  const message = useQuery(api.hello.greet, {
    name: " world",
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-svh">
      <Button
        variant={showMessage ? "outline" : "default"}
        onClick={() => setShowMessage(!showMessage)}
      >
        {`Click to ${showMessage ? "hide" : "show"} a message from the backend`}
      </Button>
      {showMessage && (
        <div className="m-2">
          Backend says:{" "}
          <code className="border px-2 py-1 rounded-md text-sm">{message}</code>
        </div>
      )}
    </div>
  );
}

export default App;
