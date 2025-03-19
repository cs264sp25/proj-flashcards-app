import { useEffect, useState } from "react";
import { useTheme } from "@/core/hooks/use-theme";
import { useRouter } from "@/core/hooks/use-router";
import { useWindowSize } from "@uidotdev/usehooks";
import Layout from "@/core/layout";
import NotFoundPage from "@/core/pages/not-found-page";
import Empty from "@/core/pages/empty";
import DemoPage from "./core/pages/demo";
import ListDecksPage from "./decks/pages/list-decks-page";
import AddDeckPage from "./decks/pages/add-deck-page";
import EditDeckPage from "./decks/pages/edit-deck-page";

function App() {
  const { theme } = useTheme();
  const { currentRoute, params } = useRouter();
  const size = useWindowSize();
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    if (size.width) {
      setIsSmallScreen(size.width <= 720);
    }
  }, [size]);

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

  const renderContent = () => {
    switch (currentRoute) {
      case "home":
        return {
          left: isSmallScreen ? null : <Empty message="Left panel" />,
          middle: <Empty message="Welcome!" />,
          right: isSmallScreen ? null : <Empty message="Right panel" />,
        };
      case "demo":
        return {
          left: null,
          middle: <DemoPage />,
          right: null,
        };
      case "decks":
        return {
          left: <ListDecksPage />,
          middle: isSmallScreen ? null : (
            <Empty message="Select a deck to view its flashcards." />
          ),
          right: null,
        };
      case "addDeck":
        return {
          left: isSmallScreen ? null : <ListDecksPage />,
          middle: <AddDeckPage />,
          right: null,
        };
      case "editDeck":
        return {
          left: isSmallScreen ? null : <ListDecksPage />,
          middle: <EditDeckPage deckId={params.deckId as string} />,
          right: null,
        };
      case "cards":
        return {
          left: isSmallScreen ? null : <ListDecksPage />,
          // middle: <ListCardsPage deckId={params.deckId as string} />,
          middle: <Empty message="Cards Page Not Implemented Yet!" />,
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
