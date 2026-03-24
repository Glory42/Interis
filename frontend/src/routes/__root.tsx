import type { QueryClient } from "@tanstack/react-query";
import {
  Link,
  Outlet,
  createRootRouteWithContext,
  useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { AppSidebar } from "@/components/layout/AppSidebar";

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
      className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
    >
      Return home
    </Link>
  </div>
);

const RootLayout = () => {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const isProfileSection = pathname.startsWith("/profile/");
  const outletAnimationKey = isProfileSection ? "/profile" : pathname;

  return (
    <>
      <div className="min-h-screen md:pl-20">
        <AppSidebar />
        <main className="min-w-0 pb-10 pt-16 md:pt-0">
          <div
            key={outletAnimationKey}
            className={
              isProfileSection
                ? ""
                : "animate-route-enter motion-reduce:animate-none"
            }
          >
            <Outlet />
          </div>
        </main>
      </div>
      {import.meta.env.DEV ? <TanStackRouterDevtools position="bottom-right" /> : null}
    </>
  );
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
});
