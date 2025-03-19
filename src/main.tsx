import "@/styles/index.css"; // Keep this line at the top so richColors can be used in the Toaster
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { Toaster } from "@/core/components/sonner";
import App from "./App.tsx";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConvexAuthProvider client={convex}>
      <App />
      <Toaster richColors position="top-center" />
    </ConvexAuthProvider>
  </StrictMode>,
);
