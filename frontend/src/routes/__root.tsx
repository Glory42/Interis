import type { QueryClient } from "@tanstack/react-query";
import {
  Link,
  Outlet,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { AppFooter } from "@/components/layout/AppFooter";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { CinemaSearchDialogProvider } from "@/features/films/components/CinemaSearchDialogProvider";

type RouterContext = {
  queryClient: QueryClient;
};

const NotFoundPage = () => (
  <div className="mx-auto flex min-h-[70vh] w-full max-w-6xl flex-col items-center justify-center gap-3 px-4 text-center">
    <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">404</p>
    <h1 className="text-3xl font-bold text-foreground">Cut to black.</h1>
    <p className="max-w-md text-sm text-muted-foreground">
      This page does not exist in the current reel.
    </p>
    <Link
      to="/"
      className=" bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
    >
      Return home
    </Link>
  </div>
);

const RootLayout = () => {
  return (
    <>
      <CinemaSearchDialogProvider>
        <div className="relative z-10 flex min-h-screen flex-col">
          <AppNavbar />
          <main className="min-w-0 flex-1 pb-10">
            <div className="animate-route-enter motion-reduce:animate-none">
              <Outlet />
            </div>
          </main>
          <AppFooter />
        </div>
      </CinemaSearchDialogProvider>
      {import.meta.env.DEV ? <TanStackRouterDevtools position="bottom-right" /> : null}
    </>
  );
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
});
