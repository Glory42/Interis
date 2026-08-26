import { type ReactElement } from "react";
import { render } from "@testing-library/react";
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const createTestQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
};

export const renderWithProviders = async (
  ui: ReactElement,
  options: {
    routePath?: string;
    initialPath?: string;
    queryClient?: QueryClient;
  } = {},
) => {
  const routePath = options.routePath ?? "/";
  const initialPath = options.initialPath ?? routePath;
  const queryClient = options.queryClient ?? createTestQueryClient();

  const rootRoute = createRootRoute({
    component: () => (
      <QueryClientProvider client={queryClient}>
        <Outlet />
      </QueryClientProvider>
    ),
  });

  const testRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: routePath,
    component: () => ui,
  });

  // A bare login route so components under test that render <Link to="/login">
  // (e.g. auth-gated actions) resolve to a real route instead of erroring.
  const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/login",
    component: () => null,
  });

  const routeTree = rootRoute.addChildren([testRoute, loginRoute]);
  const history = createMemoryHistory({ initialEntries: [initialPath] });
  const router = createRouter({
    routeTree,
    history,
  });

  // RouterProvider resolves its initial route match asynchronously (even for
  // a route with no loader) - awaiting router.load() before returning means
  // callers get a component tree that's actually finished rendering, instead
  // of needing act()-wrapped queries or findBy* everywhere.
  await router.load();
  const result = render(<RouterProvider router={router} />);

  return {
    ...result,
    router,
    queryClient,
  };
};
