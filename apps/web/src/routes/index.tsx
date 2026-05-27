import { createFileRoute } from "@tanstack/react-router";
import { authQueryOptions } from "@/features/auth/hooks/useAuth";
import {
  getFollowingFeed,
  getMyFeedSummary,
  getNetworkStats,
  getTrendingMovies,
} from "@/features/feed/api";
import { HomePage } from "@/features/feed/pages/HomePage";
import { feedKeys } from "@/features/feed/hooks/useFeed";
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
      void context.queryClient.prefetchQuery({
        queryKey: feedKeys.followingByLimit(15),
        queryFn: ({ signal }) => getFollowingFeed(15, { signal }),
      });
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
