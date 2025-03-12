import { useEffect } from "react";
import { useConvexAuth } from "convex/react";
import { useAuthToken } from "@convex-dev/auth/react";
import { useTheme } from "@/core/hooks/use-theme";
import { useRouter } from "@/core/hooks/use-router";
import Layout from "@/core/layout";
import NotFoundPage from "@/core/pages/not-found-page";
import LoginPage from "@/auth/pages/login-page";
import Loading from "@/core/components/loading";

function App() {
  const token = useAuthToken();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { theme } = useTheme();
  const { currentRoute } = useRouter();

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

  if (!currentRoute) {
    return <NotFoundPage />;
  }

  if (isLoading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderContent = () => {
    switch (currentRoute) {
      case "home":
        return {
          left: null,
          middle: (
            <div className="flex flex-col items-center justify-center min-h-svh">
              <p>Welcome</p>
              <div className="m-2">
                <div>Token:</div>
                <pre className="max-w-lg text-wrap mx-auto overflow-auto border rounded-md p-2">
                  {token}
                </pre>
              </div>
            </div>
          ),
          right: null,
        };
      default:
        return {
          left: <NotFoundPage />,
          middle: null,
          right: null,
        };
    }
  };

  const { left, middle, right } = renderContent();

  return (
    <Layout
      leftPanelContent={left}
      middlePanelContent={middle}
      rightPanelContent={right}
      className={"h-screen"}
    />
  );
}

export default App;
