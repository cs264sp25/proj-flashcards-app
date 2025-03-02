import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

function App() {
  const message = useQuery(api.hello.greet, {
    name: " world",
  });
  return <div>{message}</div>;
}

export default App;
