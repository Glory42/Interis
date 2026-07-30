import { useMemo, useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  FeedActivityList,
  type FeedFilter,
} from "@/features/feed/components/FeedActivityList";
import { FeedFilterTabs } from "@/features/feed/components/FeedFilterTabs";
import { QuickLogComposer } from "@/features/feed/components/QuickLogComposer";
import { TrendingAmongUsersRail } from "@/features/feed/components/TrendingAmongUsersRail";
import { TrendingNowRail } from "@/features/feed/components/TrendingNowRail";
import { useFollowingFeed, useTrendingNow } from "@/features/feed/hooks/useFeed";
import { useTrendingSeries } from "@/features/serials/hooks/useSerials";

export const HomePage = () => {
  const { user, isUserLoading } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FeedFilter>("all");

  const isFollowingEnabled = Boolean(user);
  // Always kept alongside the (possibly filtered) main query below - when
  // activeFilter is "all" these share the same query key/cache entry, so
  // this costs nothing extra; when a filter is active, the sidebar's
  // "trending among users" rail still reflects the full feed instead of
  // narrowing along with the main list.
  const allFeedQuery = useFollowingFeed("all", isFollowingEnabled);
  const followingFeedQuery = useFollowingFeed(activeFilter, isFollowingEnabled);
  const cinemaTrendingQuery = useTrendingNow();
  const serialTrendingQuery = useTrendingSeries();

  const feedItems = useMemo(
    () => followingFeedQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [followingFeedQuery.data],
  );
  const allFeedItems = useMemo(
    () => allFeedQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [allFeedQuery.data],
  );
  const isFeedLoading = isUserLoading || (isFollowingEnabled && followingFeedQuery.isPending);
  const isFeedError = isFollowingEnabled ? followingFeedQuery.isError : false;

  const isFetchingMoreFeed = isFollowingEnabled && followingFeedQuery.isFetchingNextPage;
  const canShowMoreFeed =
    isFollowingEnabled &&
    !isFeedLoading &&
    !isFeedError &&
    followingFeedQuery.hasNextPage;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pt-4 pb-10">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <aside className="order-2 w-full shrink-0 space-y-6 lg:order-1 lg:sticky lg:top-16 lg:w-64">
          <TrendingNowRail
            cinemaIsLoading={cinemaTrendingQuery.isPending}
            cinemaIsError={cinemaTrendingQuery.isError}
            cinemaItems={cinemaTrendingQuery.data ?? []}
            serialsIsLoading={serialTrendingQuery.isPending}
            serialsIsError={serialTrendingQuery.isError}
            serialsItems={serialTrendingQuery.data ?? []}
          />
        </aside>

        <div className="order-1 min-w-0 flex-1 lg:order-2 lg:max-w-2xl">
          <div className="mb-6 flex items-center justify-between gap-4">
            <FeedFilterTabs activeFilter={activeFilter} onFilterChange={setActiveFilter} />
          </div>

          <div id="quick-log-composer" className="mb-4">
            <QuickLogComposer user={user} />
          </div>

          <div key={activeFilter} className="animate-fade-up">
            <FeedActivityList
              isAuthenticated={isFollowingEnabled}
              isLoading={isFeedLoading}
              isError={isFeedError}
              items={feedItems}
            />
          </div>

          {canShowMoreFeed ? (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                disabled={isFetchingMoreFeed}
                onClick={() => {
                  void followingFeedQuery.fetchNextPage();
                }}
                className="theme-kicker border border-border/60 px-5 py-2 text-[10px] uppercase text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isFetchingMoreFeed ? "Loading…" : "Show more"}
              </button>
            </div>
          ) : null}
        </div>

        <aside className="order-3 w-full shrink-0 space-y-6 lg:sticky lg:top-16 lg:w-72">
          <TrendingAmongUsersRail feedItems={allFeedItems} />
        </aside>
      </div>
    </section>
  );
};
