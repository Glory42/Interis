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

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData(authQueryOptions);

    const prefetchTasks: Array<Promise<unknown>> = [
      context.queryClient.prefetchQuery({
        queryKey: feedKeys.trending,
        queryFn: ({ signal }) => getTrendingMovies({ signal }),
      }),
      context.queryClient.prefetchQuery({
        queryKey: serialKeys.trending,
        queryFn: ({ signal }) => getTrendingSeries({ signal }),
      }),
      context.queryClient.prefetchQuery({
        queryKey: feedKeys.networkStats,
        queryFn: ({ signal }) => getNetworkStats({ signal }),
      }),
    ];

    if (user) {
      prefetchTasks.push(
        context.queryClient.prefetchQuery({
          queryKey: feedKeys.followingByLimit(15),
          queryFn: ({ signal }) => getFollowingFeed(15, { signal }),
        }),
        context.queryClient.prefetchQuery({
          queryKey: feedKeys.meSummary,
          queryFn: ({ signal }) => getMyFeedSummary({ signal }),
        }),
      );
    }

    await Promise.allSettled(prefetchTasks);
  },
  component: HomeRoute,
});

function HomeRoute() {
  return <HomePage />;
}
