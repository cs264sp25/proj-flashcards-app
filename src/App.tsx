import { useEffect, useState, Suspense, lazy } from "react";
import { useTheme } from "@/core/hooks/use-theme";
import { useRouter } from "@/core/hooks/use-router";
import { useWindowSize } from "@uidotdev/usehooks";
import Layout from "@/core/layout";
import Loading from "@/core/components/loading";

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
const ListAssistantsPage = lazy(
  () => import("@/assistants/pages/list-assistants-page"),
);
const AddAssistantPage = lazy(
  () => import("@/assistants/pages/add-assistant-page"),
);
const EditAssistantPage = lazy(
  () => import("@/assistants/pages/edit-assistant-page"),
);
const ListStudiesPage = lazy(() => import("@/studies/pages/list-studies-page"));
const ViewStudyPage = lazy(() => import("@/studies/pages/study-page"));
const ListFilesPage = lazy(() => import("@/files/pages/list-files-page"));
const AddFilePage = lazy(() => import("@/files/pages/add-file-page"));
const EditFilePage = lazy(() => import("@/files/pages/edit-file-page"));

// Loading component for Suspense fallback
const LoadingFallback = () => <Loading />;

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
              <Empty message="Middle panel" />
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
              <ListDecksPage activeDeckId={params.deckId as string} />
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
              <ListDecksPage activeDeckId={params.deckId as string} />
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
              <ListCardsPage
                deckId={params.deckId as string}
                activeCardId={params.cardId as string}
              />
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
          left: (
            <Suspense fallback={<LoadingFallback />}>
              <ListChatsPage />
            </Suspense>
          ),
          middle: isSmallScreen ? null : (
            <Empty message="Select a chat to view its messages." />
          ),
          right: null,
        };
      case "addChat":
        return {
          left: (
            <Suspense fallback={<LoadingFallback />}>
              <ListChatsPage />
            </Suspense>
          ),
          middle: <AddChatPage />,
          right: null,
        };
      case "editChat":
        return {
          left: isSmallScreen ? null : (
            <Suspense fallback={<LoadingFallback />}>
              <ListChatsPage activeChatId={params.chatId as string} />
            </Suspense>
          ),
          middle: (
            <Suspense fallback={<LoadingFallback />}>
              <EditChatPage chatId={params.chatId as string} />
            </Suspense>
          ),
          right: null,
        };
      case "messages":
        return {
          left: isSmallScreen ? null : (
            <Suspense fallback={<LoadingFallback />}>
              <ListChatsPage activeChatId={params.chatId as string} />
            </Suspense>
          ),
          middle: (
            <Suspense fallback={<LoadingFallback />}>
              <MessagesPage chatId={params.chatId as string} />
            </Suspense>
          ),
          right: null,
        };
      case "assistants":
        return {
          left: (
            <Suspense fallback={<LoadingFallback />}>
              <ListAssistantsPage />
            </Suspense>
          ),
          middle: isSmallScreen ? null : (
            <Empty message="Select an assistant to view its details." />
          ),
          right: null,
        };
      case "addAssistant":
        return {
          left: (
            <Suspense fallback={<LoadingFallback />}>
              <ListAssistantsPage />
            </Suspense>
          ),
          middle: (
            <Suspense fallback={<LoadingFallback />}>
              <AddAssistantPage />
            </Suspense>
          ),
          right: null,
        };
      case "editAssistant":
        return {
          left: (
            <Suspense fallback={<LoadingFallback />}>
              <ListAssistantsPage />
            </Suspense>
          ),
          middle: (
            <Suspense fallback={<LoadingFallback />}>
              <EditAssistantPage assistantId={params.assistantId as string} />
            </Suspense>
          ),
          right: null,
        };
      case "studies":
        return {
          left: (
            <Suspense fallback={<LoadingFallback />}>
              <ListStudiesPage />
            </Suspense>
          ),
          middle: null,
          right: null,
        };
      case "viewStudy":
        return {
          left: (
            <Suspense fallback={<LoadingFallback />}>
              <ViewStudyPage studyId={params.studyId as string} />
            </Suspense>
          ),
          middle: null,
          right: null,
        };
      case "files":
        return {
          left: (
            <Suspense fallback={<LoadingFallback />}>
              <ListFilesPage />
            </Suspense>
          ),
          middle: null,
          right: null,
        };
      case "addFile":
        return {
          left: isSmallScreen ? null : (
            <Suspense fallback={<LoadingFallback />}>
              <ListFilesPage />
            </Suspense>
          ),
          middle: (
            <Suspense fallback={<LoadingFallback />}>
              <AddFilePage />
            </Suspense>
          ),
          right: null,
        };
      case "editFile":
        return {
          left: isSmallScreen ? null : (
            <Suspense fallback={<LoadingFallback />}>
              <ListFilesPage />
            </Suspense>
          ),
          middle: (
            <Suspense fallback={<LoadingFallback />}>
              <EditFilePage fileId={params.fileId as string} />
            </Suspense>
          ),
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
