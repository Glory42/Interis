import { useMemo, useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  FeedActivityList,
  type FeedFilter,
} from "@/features/feed/components/FeedActivityList";
import { FeedFilterTabs } from "@/features/feed/components/FeedFilterTabs";
import { QuickLogComposer } from "@/features/feed/components/QuickLogComposer";
import { TrendingNowRail } from "@/features/feed/components/TrendingNowRail";
import { useFollowingFeed, useTrendingNow } from "@/features/feed/hooks/useFeed";
import { useTrendingSeries } from "@/features/serials/hooks/useSerials";

export const HomePage = () => {
  const { user, isUserLoading } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FeedFilter>("all");

  const isFollowingEnabled = Boolean(user);
  const followingFeedQuery = useFollowingFeed(activeFilter, isFollowingEnabled);
  const cinemaTrendingQuery = useTrendingNow(6);
  const serialTrendingQuery = useTrendingSeries();

  const feedItems = useMemo(
    () => followingFeedQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [followingFeedQuery.data],
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
    <section className="mx-auto w-full max-w-400 px-4 pt-8 pb-16">
      <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 lg:max-w-2xl">
          <div id="quick-log-composer" className="surface-card mb-6 p-4">
            <QuickLogComposer user={user} />
          </div>

          <div className="mb-8 flex items-center justify-between gap-4">
            <FeedFilterTabs activeFilter={activeFilter} onFilterChange={setActiveFilter} />
          </div>

          <div className="animate-fade-up">
            <FeedActivityList
              isAuthenticated={isFollowingEnabled}
              isLoading={isFeedLoading}
              isError={isFeedError}
              items={feedItems}
            />
          </div>

          {canShowMoreFeed ? (
            <div className="mt-8 flex justify-center">
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

        <aside className="w-full shrink-0 lg:sticky lg:top-16 lg:w-72">
          <TrendingNowRail
            cinemaIsLoading={cinemaTrendingQuery.isPending}
            cinemaIsError={cinemaTrendingQuery.isError}
            cinemaItems={cinemaTrendingQuery.data ?? []}
            serialsIsLoading={serialTrendingQuery.isPending}
            serialsIsError={serialTrendingQuery.isError}
            serialsItems={serialTrendingQuery.data ?? []}
          />
        </aside>
      </div>
    </section>
  );
};
