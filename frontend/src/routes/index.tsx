import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { FeedActivityList } from "@/features/feed/components/FeedActivityList";
import { MyProfileSummaryRail } from "@/features/feed/components/MyProfileSummaryRail";
import { QuickLogComposer } from "@/features/feed/components/QuickLogComposer";
import { TrendingNowRail } from "@/features/feed/components/TrendingNowRail";
import {
  useFollowingFeed,
  useMyFeedSummary,
  useTrendingNow,
} from "@/features/feed/hooks/useFeed";
import { useAuth } from "@/features/auth/hooks/useAuth";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const { user } = useAuth();

  const isFollowingEnabled = Boolean(user);
  const followingFeedQuery = useFollowingFeed(isFollowingEnabled);
  const trendingQuery = useTrendingNow();
  const mySummaryQuery = useMyFeedSummary(Boolean(user));

  const feedItems = followingFeedQuery.data ?? [];
  const isFeedLoading = isFollowingEnabled
    ? followingFeedQuery.isPending
    : false;
  const isFeedError = isFollowingEnabled ? followingFeedQuery.isError : false;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8">
      <main className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <aside className="hidden lg:col-span-3 lg:block lg:space-y-6">
          <TrendingNowRail
            isLoading={trendingQuery.isPending}
            isError={trendingQuery.isError}
            items={trendingQuery.data ?? []}
          />
        </aside>

        <section className="space-y-5 lg:col-span-6">
          <header className="flex flex-col gap-2">
            <div>
              <h1 className="flex items-center gap-2 text-xl font-bold text-foreground">
                Feed
                <Badge variant="accent" className="w-7.5">
                  ⚡︎
                </Badge>
              </h1>
            </div>
          </header>

          <QuickLogComposer user={user} />

          <FeedActivityList
            isAuthenticated={isFollowingEnabled}
            isLoading={isFeedLoading}
            isError={isFeedError}
            items={feedItems}
          />
        </section>

        <aside className="hidden lg:col-span-3 lg:block">
          <MyProfileSummaryRail
            user={user}
            isLoading={mySummaryQuery.isPending}
            isError={mySummaryQuery.isError}
            summary={mySummaryQuery.data ?? null}
          />
        </aside>
      </main>

      <div className="mt-8 grid gap-6 lg:hidden">
        <MyProfileSummaryRail
          user={user}
          isLoading={mySummaryQuery.isPending}
          isError={mySummaryQuery.isError}
          summary={mySummaryQuery.data ?? null}
        />

        <TrendingNowRail
          isLoading={trendingQuery.isPending}
          isError={trendingQuery.isError}
          items={trendingQuery.data ?? []}
        />
      </div>
    </section>
  );
}
