import { useConvexAuth } from "convex/react";
import { cn } from "@/core/lib/utils";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/core/components/resizable";
import { SidebarProvider } from "@/core/components/sidebar";
import Loading from "@/core/components/loading";
import LoginPage from "@/auth/pages/login-page";
import Sidebar from "./sidebar";
import Header from "./header";
import Footer from "./footer";

const DEBUG = false;

interface LayoutProps {
  leftPanelContent: React.ReactNode;
  middlePanelContent: React.ReactNode;
  rightPanelContent: React.ReactNode;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({
  leftPanelContent,
  middlePanelContent,
  rightPanelContent,
  className,
}) => {
  const { isLoading, isAuthenticated } = useConvexAuth();

  if (isLoading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <SidebarProvider
      className={cn(
        "flex min-h-screen w-full antialiased scroll-smooth",
        className,
        {
          "border-2 border-red-500": DEBUG,
        },
      )}
    >
      <Sidebar />
      <div
        className={cn("flex flex-col px-2 w-full", {
          "border-2 border-purple-500": DEBUG,
        })}
      >
        <Header />
        <ResizablePanelGroup
          autoSaveId="layout"
          direction="horizontal"
          className={cn("flex-1", {
            "border-2 border-pink-500 ": DEBUG,
          })}
        >
          {leftPanelContent && (
            <ResizablePanel
              className={cn({
                "border-2 border-blue-500": DEBUG,
              })}
              minSize={30}
              order={1}
              collapsedSize={0}
              collapsible={true}
              id="left-panel"
            >
              {leftPanelContent}
            </ResizablePanel>
          )}
          {leftPanelContent && (middlePanelContent || rightPanelContent) && (
            <ResizableHandle withHandle />
          )}
          {middlePanelContent && (
            <ResizablePanel
              minSize={30}
              className={cn({
                "border-2 border-green-500": DEBUG,
              })}
              order={2}
              id="middle-panel"
            >
              {middlePanelContent}
            </ResizablePanel>
          )}
          {(leftPanelContent || middlePanelContent) && rightPanelContent && (
            <ResizableHandle withHandle />
          )}
          {rightPanelContent && (
            <ResizablePanel
              minSize={30}
              className={cn({
                "border-2 border-yellow-500": DEBUG,
              })}
              order={3}
              collapsedSize={0}
              collapsible={true}
              id="right-panel"
            >
              {rightPanelContent}
            </ResizablePanel>
          )}
        </ResizablePanelGroup>
        <Footer />
      </div>
    </SidebarProvider>
  );
};

export default Layout;
