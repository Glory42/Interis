import { ReelCells } from "@/components/film/ReelCells";
import { MonthBars, RankedBars, RatingBars, WeekReel } from "@/features/profile/components/stats/StatsCharts";
import { STATS_MIN_LOGS, fillLastTwelveMonths, toRatingBuckets, toWeekReel } from "@/features/profile/components/stats/stats-model";
import { useIsOwnProfile, useUserProfile } from "@/features/profile/hooks/useProfile";
import { useDetailedStats } from "@/features/profile/hooks/useProfileStats";
import { StatsSkeleton } from "@/components/ui/PageSkeletons";

type ProfileStatsPageProps = {
  username: string;
  now?: Date;
};

const Headline = ({ value, label }: { value: string; label: string }) => (
  <div>
    <p className="display-2 leading-none text-foreground">{value}</p>
    <p className="kicker mt-1 text-muted-foreground">{label}</p>
  </div>
);

const Block = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section aria-label={title}>
    <p className="kicker mb-2 text-muted-foreground">{title}</p>
    {children}
  </section>
);

export const ProfileStatsPage = ({ username, now: nowProp }: ProfileStatsPageProps) => {
  const now = nowProp ?? new Date();
  const statsQuery = useDetailedStats(username);
  const profileQuery = useUserProfile(username);
  const isOwner = useIsOwnProfile(username);
  const logged = (profileQuery.data?.stats?.movieEntryCount ?? 0) + (profileQuery.data?.stats?.serialEntryCount ?? 0);

  if (statsQuery.isPending || profileQuery.isPending) {
    return <StatsSkeleton />;
  }

  if (statsQuery.isError) {
    return <p className="body-s text-[color:var(--danger)]">Could not load stats right now.</p>;
  }

  if (logged < STATS_MIN_LOGS) {
    return (
      <div className="border-t border-[color:var(--line)] pt-4">
        <p className="body-s text-muted-foreground">
          {isOwner ? `${STATS_MIN_LOGS - logged} more logs to start your stats.` : "Not enough logs for stats yet."}
        </p>
        {isOwner ? <ReelCells total={STATS_MIN_LOGS} watched={logged} tone="film" className="mt-2" /> : null}
      </div>
    );
  }

  const stats = statsQuery.data;
  const reviews = profileQuery.data?.stats?.reviewCount ?? 0;

  return (
    <div className="space-y-7">
      <div className="grid grid-cols-2 gap-4 border-b border-[color:var(--line)] pb-4 sm:grid-cols-4">
        <Headline value={logged.toLocaleString("en-US")} label="logged" />
        <Headline value={reviews.toLocaleString("en-US")} label="reviews" />
        <Headline value={stats.averageRating !== null ? stats.averageRating.toFixed(1) : "—"} label="avg rating" />
        <Headline value={`${Math.round(stats.hoursWatched).toLocaleString("en-US")}h`} label="watched" />
      </div>

      <Block title={`${now.getFullYear()} in reels · one cell per week`}>
        <WeekReel cells={toWeekReel(stats.logsPerWeek, now)} year={now.getFullYear()} />
      </Block>

      <div className="grid gap-6 md:grid-cols-[1fr_1.5fr]">
        <Block title="Logs per month · last 12">
          <MonthBars months={fillLastTwelveMonths(stats.entriesPerMonth, now)} />
        </Block>
        <Block title={`Ratings · ${stats.ratedLogCount.toLocaleString("en-US")} rated logs`}>
          <RatingBars buckets={toRatingBuckets(stats.ratingDistribution)} average={stats.averageRating} />
        </Block>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Block title="Top genres">
          {stats.topGenres.length > 0 ? (
            <RankedBars rows={stats.topGenres.map((row) => ({ label: row.genre, count: row.count }))} />
          ) : (
            <p className="body-s text-muted-foreground">Not enough data yet.</p>
          )}
        </Block>
        <Block title="Top directors">
          {stats.topDirectors.length > 0 ? (
            <RankedBars rows={stats.topDirectors.map((row) => ({ label: row.director, count: row.count, slug: row.slug }))} />
          ) : (
            <p className="body-s text-muted-foreground">Not enough data yet.</p>
          )}
        </Block>
      </div>
    </div>
  );
};
