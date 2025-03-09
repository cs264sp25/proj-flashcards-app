import { useConvexAuth } from "convex/react";
import { useAuthToken } from "@convex-dev/auth/react";
import { SignOut } from "@/components/sign-out";
import { SignIn } from "@/components/sign-in";

function App() {
  const token = useAuthToken();
  const { isLoading, isAuthenticated } = useConvexAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-svh">
      {isAuthenticated ? (
        <>
          <SignOut />
          <div className="m-2">
            <div>Token:</div>
            <pre className="max-w-lg text-wrap mx-auto overflow-auto border rounded-md p-2">
              {token}
            </pre>
          </div>
        </>
      ) : isLoading ? (
        <div>Loading...</div>
      ) : (
        <SignIn />
      )}
    </div>
  );
}

export default App;
