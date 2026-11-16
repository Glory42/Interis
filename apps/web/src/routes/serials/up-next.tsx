import { createFileRoute } from "@tanstack/react-router";
import { UpNextPage } from "@/features/tv/components/up-next/UpNextPage";
import { upNextQueryOptions } from "@/features/tv/hooks/useTv";
import { requireAuthenticatedUser } from "@/lib/router/auth-guards";
import { RouteErrorBoundary } from "@/lib/router/RouteErrorBoundary";

export const Route = createFileRoute("/serials/up-next")({
  beforeLoad: async ({ context, location }) => {
    await requireAuthenticatedUser({ queryClient: context.queryClient, redirectPath: location.pathname });
  },
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(upNextQueryOptions());
  },
  component: UpNextPage,
  errorComponent: (props) => <RouteErrorBoundary {...props} title="Up next unavailable" />,
});
