import { useEffect, useState, Suspense, lazy } from "react";
import { useTheme } from "@/core/hooks/use-theme";
import { useRouter } from "@/core/hooks/use-router";
import { useWindowSize } from "@uidotdev/usehooks";
import Layout from "@/core/layout";

// Lazy load all page components
const NotFoundPage = lazy(() => import("@/core/pages/not-found-page"));
const Empty = lazy(() => import("@/core/pages/empty"));
const DemoPage = lazy(() => import("@/core/pages/demo"));
const ListDecksPage = lazy(() => import("@/decks/pages/list-decks-page"));
const AddDeckPage = lazy(() => import("@/decks/pages/add-deck-page"));
const EditDeckPage = lazy(() => import("@/decks/pages/edit-deck-page"));
const ListCardsPage = lazy(() => import("@/cards/pages/list-cards-page"));
const AddCardPage = lazy(() => import("@/cards/pages/add-card-page"));
const EditCardPage = lazy(() => import("@/cards/pages/edit-card-page"));
const ListChatsPage = lazy(() => import("@/chats/pages/list-chats-page"));
const AddChatPage = lazy(() => import("@/chats/pages/add-chat-page"));
const EditChatPage = lazy(() => import("@/chats/pages/edit-chat-page"));
const MessagesPage = lazy(() => import("@/messages/pages/messages-page"));

// Loading component for Suspense fallback
const LoadingFallback = () => <div>Loading...</div>;

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
          left: isSmallScreen ? null : (
            <Suspense fallback={<LoadingFallback />}>
              <Empty message="Left panel" />
            </Suspense>
          ),
          middle: (
            <Suspense fallback={<LoadingFallback />}>
              <Empty message="Welcome!" />
            </Suspense>
          ),
          right: isSmallScreen ? null : (
            <Suspense fallback={<LoadingFallback />}>
              <Empty message="Right panel" />
            </Suspense>
          ),
        };
      case "demo":
        return {
          left: null,
          middle: (
            <Suspense fallback={<LoadingFallback />}>
              <DemoPage />
            </Suspense>
          ),
          right: null,
        };
      case "decks":
        return {
          left: (
            <Suspense fallback={<LoadingFallback />}>
              <ListDecksPage />
            </Suspense>
          ),
          middle: isSmallScreen ? null : (
            <Suspense fallback={<LoadingFallback />}>
              <Empty message="Select a deck to view its flashcards." />
            </Suspense>
          ),
          right: null,
        };
      case "addDeck":
        return {
          left: isSmallScreen ? null : (
            <Suspense fallback={<LoadingFallback />}>
              <ListDecksPage />
            </Suspense>
          ),
          middle: (
            <Suspense fallback={<LoadingFallback />}>
              <AddDeckPage />
            </Suspense>
          ),
          right: null,
        };
      case "editDeck":
        return {
          left: isSmallScreen ? null : (
            <Suspense fallback={<LoadingFallback />}>
              <ListDecksPage />
            </Suspense>
          ),
          middle: (
            <Suspense fallback={<LoadingFallback />}>
              <EditDeckPage deckId={params.deckId as string} />
            </Suspense>
          ),
          right: null,
        };
      case "cards":
        return {
          left: isSmallScreen ? null : (
            <Suspense fallback={<LoadingFallback />}>
              <ListDecksPage />
            </Suspense>
          ),
          middle: (
            <Suspense fallback={<LoadingFallback />}>
              <ListCardsPage deckId={params.deckId as string} />
            </Suspense>
          ),
          right: null,
        };
      case "addCard":
        return {
          left: isSmallScreen ? null : (
            <Suspense fallback={<LoadingFallback />}>
              <ListDecksPage />
            </Suspense>
          ),
          middle: isSmallScreen ? null : (
            <Suspense fallback={<LoadingFallback />}>
              <ListCardsPage deckId={params.deckId as string} />
            </Suspense>
          ),
          right: (
            <Suspense fallback={<LoadingFallback />}>
              <AddCardPage deckId={params.deckId as string} />
            </Suspense>
          ),
        };
      case "editCard":
        return {
          left: isSmallScreen ? null : (
            <Suspense fallback={<LoadingFallback />}>
              <ListDecksPage />
            </Suspense>
          ),
          middle: isSmallScreen ? null : (
            <Suspense fallback={<LoadingFallback />}>
              <ListCardsPage deckId={params.deckId as string} />
            </Suspense>
          ),
          right: (
            <Suspense fallback={<LoadingFallback />}>
              <EditCardPage
                deckId={params.deckId as string}
                cardId={params.cardId as string}
              />
            </Suspense>
          ),
        };
      case "chats":
        return {
          left: <ListChatsPage />,
          middle: isSmallScreen ? null : (
            <Empty message="Select a chat to view its messages." />
          ),
          right: null,
        };
      case "addChat":
        return {
          left: isSmallScreen ? null : <ListChatsPage />,
          middle: <AddChatPage />,
          right: null,
        };
      case "editChat":
        return {
          left: isSmallScreen ? null : <ListChatsPage />,
          middle: <EditChatPage chatId={params.chatId as string} />,
          right: null,
        };
      case "messages":
        return {
          left: isSmallScreen ? null : <ListChatsPage />,
          middle: <MessagesPage chatId={params.chatId as string} />,
          right: null,
        };
      default:
        return {
          left: (
            <Suspense fallback={<LoadingFallback />}>
              <NotFoundPage />
            </Suspense>
          ),
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
