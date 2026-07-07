import { createFileRoute } from "@tanstack/react-router";
import { authQueryOptions } from "@/features/auth/hooks/useAuth";
import {
  getMyFeedSummary,
  getNetworkStats,
  getTrendingMovies,
} from "@/features/feed/api";
import { HomePage } from "@/features/feed/pages/HomePage";
import { feedKeys, followingFeedInfiniteQueryOptions } from "@/features/feed/hooks/useFeed";
import { getTrendingSeries } from "@/features/serials/api";
import { serialKeys } from "@/features/serials/hooks/useSerials";
import { RouteErrorBoundary } from "@/lib/router/RouteErrorBoundary";

export const Route = createFileRoute("/")({
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(authQueryOptions);
    void context.queryClient.prefetchQuery({
      queryKey: feedKeys.trending,
      queryFn: ({ signal }) => getTrendingMovies({ signal }),
    });
    void context.queryClient.prefetchQuery({
      queryKey: serialKeys.trending,
      queryFn: ({ signal }) => getTrendingSeries({ signal }),
    });
    void context.queryClient.prefetchQuery({
      queryKey: feedKeys.networkStats,
      queryFn: ({ signal }) => getNetworkStats({ signal }),
    });

    const cachedUser = context.queryClient.getQueryData(authQueryOptions.queryKey);
    if (cachedUser) {
      void context.queryClient.prefetchInfiniteQuery(followingFeedInfiniteQueryOptions());
      void context.queryClient.prefetchQuery({
        queryKey: feedKeys.meSummary,
        queryFn: ({ signal }) => getMyFeedSummary({ signal }),
      });
    }
  },
  component: HomeRoute,
  errorComponent: (props) => <RouteErrorBoundary {...props} title="Could not load home feed" />,
});

function HomeRoute() {
  return <HomePage />;
}
