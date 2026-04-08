import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  FeedActivityList,
  type FeedFilter,
} from "@/features/feed/components/FeedActivityList";
import { MyProfileSummaryRail } from "@/features/feed/components/MyProfileSummaryRail";
import { QuickLogComposer } from "@/features/feed/components/QuickLogComposer";
import { TrendingNowRail } from "@/features/feed/components/TrendingNowRail";
import {
  useFollowingFeed,
  useMyFeedSummary,
  useNetworkStats,
  useTrendingNow,
} from "@/features/feed/hooks/useFeed";
import { useTrendingSeries } from "@/features/serials/hooks/useSerials";

const filterTabs: Array<{ id: FeedFilter; label: string }> = [
  { id: "all", label: "ALL" },
  { id: "cinema", label: "CINEMA" },
  { id: "serial", label: "SERIAL" },
  { id: "codex", label: "CODEX" },
  { id: "echoes", label: "ECHOES" },
];

export const HomePage = () => {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FeedFilter>("all");
  const [feedLimit, setFeedLimit] = useState(15);

  const isFollowingEnabled = Boolean(user);
  const followingFeedQuery = useFollowingFeed(isFollowingEnabled, feedLimit);
  const cinemaTrendingQuery = useTrendingNow();
  const serialTrendingQuery = useTrendingSeries();
  const mySummaryQuery = useMyFeedSummary(Boolean(user));
  const networkStatsQuery = useNetworkStats();

  const feedItems = useMemo(
    () => followingFeedQuery.data ?? [],
    [followingFeedQuery.data],
  );
  const isFeedLoading = isFollowingEnabled
    ? followingFeedQuery.isPending
    : false;
  const isFeedError = isFollowingEnabled ? followingFeedQuery.isError : false;

  const totalUsers = networkStatsQuery.data?.totalUsers ?? null;
  const liveReviews = networkStatsQuery.data?.liveReviews ?? null;
  const logsToday = networkStatsQuery.data?.logsToday ?? null;
  const isFetchingMoreFeed =
    isFollowingEnabled &&
    followingFeedQuery.isFetching &&
    !followingFeedQuery.isPending;
  const canShowMoreFeed =
    isFollowingEnabled &&
    !isFeedLoading &&
    !isFeedError &&
    feedItems.length >= feedLimit;

  const focusQuickLogComposer = () => {
    const composerNode = document.getElementById("quick-log-composer");
    if (!composerNode) {
      return;
    }

    composerNode.scrollIntoView({ behavior: "smooth", block: "center" });
    const focusTarget = composerNode.querySelector<HTMLElement>("textarea");
    focusTarget?.focus();
  };

  return (
    <section className="mx-auto w-full max-w-400 px-4 py-8">
      <div className="mb-10 border-b border-border/60 pb-8">
        <div className="mb-2 flex items-center gap-2">
          <span className="font-mono text-[10px] text-muted-foreground/70">
            root@null
          </span>
          <span className="font-mono text-[10px] text-muted-foreground/70">
            :
          </span>
          <span className="font-mono text-[10px] text-primary">~/void</span>
          <span className="font-mono text-[10px] text-muted-foreground/70">
            $
          </span>
          <span className="font-mono text-sm text-muted-foreground">
            {" "}
            ./run_feed --all --live
          </span>
          <span className="animate-pulse font-mono text-sm text-muted-foreground">
            _
          </span>
        </div>

        <h1 className="font-mono text-4xl font-bold text-foreground md:text-6xl">
          INTERIS://FEED
        </h1>

        <p className="mt-3 max-w-xl font-mono text-sm text-muted-foreground/80">
          // Live reviews from the network. Cinema · Serial · Codex · Echoes.
          <br />
          // Logged, not filtered. Unranked, not curated.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse  bg-(--module-cinema)" />
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              LIVE_REVIEWS:
            </span>
            <span className="font-mono text-[11px] font-bold text-(--module-cinema)">
              {liveReviews ?? "--"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse  bg-(--module-serial)" />
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              TOTAL_USERS:
            </span>
            <span className="font-mono text-[11px] font-bold text-(--module-serial)">
              {totalUsers ?? "--"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse  bg-(--module-codex)" />
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              LOGS_TODAY:
            </span>
            <span className="font-mono text-[11px] font-bold text-(--module-codex)">
              {logsToday ?? "--"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-10 lg:flex-row">
        <div className="min-w-0 flex-1">
          <div className="mb-6 flex border-b border-border/60">
            {filterTabs.map((tab) => {
              const isActive = activeFilter === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  className="border-b-2 px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] transition-all"
                  style={{
                    borderBottomColor: isActive
                      ? "var(--foreground)"
                      : "transparent",
                    color: isActive
                      ? "var(--foreground)"
                      : "rgba(255,255,255,0.34)",
                  }}
                  onClick={() => setActiveFilter(tab.id)}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div id="quick-log-composer" className="mb-6">
            <QuickLogComposer user={user} />
          </div>

          <FeedActivityList
            isAuthenticated={isFollowingEnabled}
            isLoading={isFeedLoading}
            isError={isFeedError}
            items={feedItems}
            activeFilter={activeFilter}
          />

          {canShowMoreFeed ? (
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                disabled={isFetchingMoreFeed}
                onClick={() => {
                  setFeedLimit((currentLimit) => currentLimit + 15);
                }}
                className="border border-border/70 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isFetchingMoreFeed ? "Loading..." : "Show more"}
              </button>
            </div>
          ) : null}
        </div>

        <aside className="w-full shrink-0 space-y-6 lg:w-72">
          <TrendingNowRail
            cinemaIsLoading={cinemaTrendingQuery.isPending}
            cinemaIsError={cinemaTrendingQuery.isError}
            cinemaItems={cinemaTrendingQuery.data ?? []}
            serialsIsLoading={serialTrendingQuery.isPending}
            serialsIsError={serialTrendingQuery.isError}
            serialsItems={serialTrendingQuery.data ?? []}
          />

          <MyProfileSummaryRail
            user={user}
            isLoading={mySummaryQuery.isPending}
            isError={mySummaryQuery.isError}
            summary={mySummaryQuery.data ?? null}
            feedItems={feedItems}
          />
        </aside>
      </div>

      <button
        type="button"
        onClick={focusQuickLogComposer}
        className="theme-button-primary fixed right-6 bottom-8 z-40 inline-flex items-center gap-2 border border-primary bg-primary px-5 py-3 font-mono text-xs font-bold uppercase tracking-[0.14em] text-primary-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
      >
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">LOG IT</span>
      </button>
    </section>
  );
};
