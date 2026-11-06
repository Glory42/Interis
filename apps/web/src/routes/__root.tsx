import type { QueryClient } from "@tanstack/react-query";
import {
  HeadContent,
  Outlet,
  createRootRouteWithContext,
  useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { AppFooter } from "@/components/layout/AppFooter";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { NotFoundPage } from "@/components/layout/NotFoundPage";
import { Toaster } from "@/components/ui/Toaster";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { GlobalSearchDialogProvider } from "@/features/search/components/GlobalSearchDialogProvider";
import { RouteErrorBoundary } from "@/lib/router/RouteErrorBoundary";

type RouterContext = {
  queryClient: QueryClient;
};

const RootLayout = () => {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { user } = useAuth();
  const isGuestLanding = pathname === "/" && !user;

  return (
    <>
      <HeadContent />
      <GlobalSearchDialogProvider>
        <div className="relative z-10 flex min-h-screen flex-col">
          {isGuestLanding ? null : <AppNavbar />}
          <main className="min-w-0 flex-1 pb-10">
            <div className="animate-route-enter motion-reduce:animate-none">
              <Outlet />
            </div>
          </main>
          <AppFooter />
        </div>
      </GlobalSearchDialogProvider>
      <Toaster />
      {import.meta.env.DEV ? <TanStackRouterDevtools position="bottom-right" /> : null}
    </>
  );
};

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { title: "Interis" },
      {
        name: "description",
        content:
          "Log watches, write reviews, follow friends, and browse a movie and TV archive.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Interis" },
      { property: "og:title", content: "Interis" },
      {
        property: "og:description",
        content:
          "Log watches, write reviews, follow friends, and browse a movie and TV archive.",
      },
      { property: "og:image", content: "/og-image.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RootLayout,
  notFoundComponent: NotFoundPage,
  errorComponent: (props) => (
    <RouteErrorBoundary {...props} title="Application shell failed to load" />
  ),
});
