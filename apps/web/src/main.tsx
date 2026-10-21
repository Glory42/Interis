import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { routeTree } from "./routeTree.gen";
import { queryClient } from "./lib/query-client";
import { installSafeViewTransitions } from "./lib/view-transition";
import { bootstrapStoredTheme } from "@/features/theme/theme-runtime";
import "./index.css";

const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
  // No hover preloading: route loaders hit DB-backed endpoints, so sweeping the
  // cursor across a poster grid fired a detail fetch per poster.
  defaultPreload: false,
  defaultStructuralSharing: true,
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root not found");
}

bootstrapStoredTheme();
installSafeViewTransitions();

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
