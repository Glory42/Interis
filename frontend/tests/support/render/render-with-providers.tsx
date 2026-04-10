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

export const renderWithProviders = (
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

  const routeTree = rootRoute.addChildren([testRoute]);
  const history = createMemoryHistory({ initialEntries: [initialPath] });
  const router = createRouter({
    routeTree,
    history,
  });

  const result = render(<RouterProvider router={router} />);

  return {
    ...result,
    router,
    queryClient,
  };
};
