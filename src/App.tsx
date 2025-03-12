import { useEffect } from "react";
import { useConvexAuth } from "convex/react";
import { useAuthToken } from "@convex-dev/auth/react";
import { SignOut } from "@/auth/components/sign-out";
import { SignIn } from "@/auth/components/sign-in";
import Layout from "@/core/layout";
import { useTheme } from "@/core/hooks/use-theme";

function App() {
  const token = useAuthToken();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { theme } = useTheme();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const middle = (
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
  return (
    <Layout
      leftPanelContent={null}
      middlePanelContent={middle}
      rightPanelContent={null}
      className="h-screen"
    />
  );
}

export default App;
