import { createFileRoute } from "@tanstack/react-router";
import { authQueryOptions, useAuth } from "@/features/auth/hooks/useAuth";
import {
  getMyFeedSummary,
  getNetworkStats,
  getTrendingMovies,
  getTrendingOnInteris,
} from "@/features/feed/api";
import { HomePage } from "@/features/feed/pages/HomePage";
import {
  feedKeys,
  followingFeedInfiniteQueryOptions,
} from "@/features/feed/hooks/useFeed";
import { LandingPage } from "@/features/landing/pages/LandingPage";
import { getTrendingSeries } from "@/features/serials/api";
import { serialKeys } from "@/features/serials/hooks/useSerials";
import { RouteErrorBoundary } from "@/lib/router/RouteErrorBoundary";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    const user = await context.queryClient.fetchQuery(authQueryOptions);

    void context.queryClient.prefetchQuery({
      queryKey: feedKeys.trending(user ? 3 : 9),
      queryFn: ({ signal }) => getTrendingMovies({ signal, limit: user ? 3 : 9 }),
    });
    void context.queryClient.prefetchQuery({
      queryKey: serialKeys.trending,
      queryFn: ({ signal }) => getTrendingSeries({ signal }),
    });

    if (!user) {
      return;
    }

    void context.queryClient.prefetchQuery({
      queryKey: feedKeys.trendingOnInteris(),
      queryFn: ({ signal }) => getTrendingOnInteris({ signal }),
    });
    void context.queryClient.prefetchQuery({
      queryKey: feedKeys.networkStats,
      queryFn: ({ signal }) => getNetworkStats({ signal }),
    });
    void context.queryClient.prefetchInfiniteQuery(followingFeedInfiniteQueryOptions());
    void context.queryClient.prefetchQuery({
      queryKey: feedKeys.meSummary,
      queryFn: ({ signal }) => getMyFeedSummary({ signal }),
    });
  },
  component: HomeRoute,
  errorComponent: (props) => <RouteErrorBoundary {...props} title="Could not load home feed" />,
});

function HomeRoute() {
  const { user } = useAuth();

  return user ? <HomePage /> : <LandingPage />;
}
