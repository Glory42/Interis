import { useMemo, useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { FeedDayList } from "@/features/feed/components/FeedDayList";
import { FeedFilterSentence } from "@/features/feed/components/FeedFilterSentence";
import { toFeedDays } from "@/features/feed/components/feed-days";
import type { FeedFilter } from "@/features/feed/types";
import { QuickLogComposer } from "@/features/feed/components/QuickLogComposer";
import { FeedRail } from "@/features/feed/components/FeedRail";
import { useGroupedFeed, useMyFeedSummary, useTrendingNow } from "@/features/feed/hooks/useFeed";
import { useTrendingSeries } from "@/features/tv/hooks/useTv";

export const HomePage = () => {
  const { user, isUserLoading } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FeedFilter>("all");

  const isFollowingEnabled = Boolean(user);
  const followingFeedQuery = useGroupedFeed(activeFilter, isFollowingEnabled);
  const movieTrendingQuery = useTrendingNow(6);
  const serialTrendingQuery = useTrendingSeries();
  const summaryQuery = useMyFeedSummary(isFollowingEnabled);

  const feedDays = useMemo(
    () => toFeedDays(followingFeedQuery.data?.pages.flatMap((page) => page.items) ?? []),
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
    <section className="mx-auto w-full max-w-[1032px] px-4 pt-8 pb-16">
      <div className="flex flex-col gap-10 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1 lg:max-w-2xl">
          <div id="quick-log-composer" className="mb-4 rounded-[3px] border border-[color:var(--line)] p-3">
            <QuickLogComposer user={user} />
          </div>

          <div className="mb-5">
            <FeedFilterSentence filter={activeFilter} onChange={setActiveFilter} />
          </div>

          <div className="animate-fade-up">
            <FeedDayList isLoading={isFeedLoading} isError={isFeedError} days={feedDays} />
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

        <aside className="w-full shrink-0 lg:sticky lg:top-16 lg:w-60">
          <FeedRail
            films={movieTrendingQuery.data ?? []}
            shows={serialTrendingQuery.data ?? []}
            week={summaryQuery.data?.week ?? null}
            isLoading={movieTrendingQuery.isPending || serialTrendingQuery.isPending}
          />
        </aside>
      </div>
    </section>
  );
};
