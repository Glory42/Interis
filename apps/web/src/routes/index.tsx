import { createFileRoute } from "@tanstack/react-router";
import { authQueryOptions, useAuth } from "@/features/auth/hooks/useAuth";
import { HomePage } from "@/features/feed/pages/HomePage";
import {
  followingFeedInfiniteQueryOptions,
  trendingMoviesQueryOptions,
} from "@/features/feed/hooks/useFeed";
import { LandingPage } from "@/features/landing/pages/LandingPage";
import { trendingSeriesQueryOptions } from "@/features/serials/hooks/useSerials";
import { RouteErrorBoundary } from "@/lib/router/RouteErrorBoundary";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    // A failed auth check (transient backend error, dropped connection)
    // must not crash the whole home route - fall back to guest so the
    // page still renders; useAuth's own query reflects the real state.
    const user = await context.queryClient.fetchQuery(authQueryOptions).catch(() => null);

    // Limits must match what HomePage (6) / LandingPage (9) actually read.
    void context.queryClient.prefetchQuery(trendingMoviesQueryOptions(user ? 6 : 9));
    void context.queryClient.prefetchQuery(trendingSeriesQueryOptions());

    if (!user) {
      return;
    }

    void context.queryClient.prefetchInfiniteQuery(followingFeedInfiniteQueryOptions());
  },
  component: HomeRoute,
  errorComponent: (props) => <RouteErrorBoundary {...props} title="Could not load home feed" />,
});

function HomeRoute() {
  const { user } = useAuth();

  return user ? <HomePage /> : <LandingPage />;
}
