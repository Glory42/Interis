import { DayHeatmap } from "@/features/profile/components/stats/DayHeatmap";
import { toDayHeatmap } from "@/features/profile/components/stats/day-heatmap-model";
import { MonthBars } from "@/features/profile/components/stats/StatsCharts";
import type { YearReview } from "@/features/year-review/api";
import { MONTH_NAMES, formatDay, heatmapEnd, plural, toMonthBars } from "@/features/year-review/year-review-model";
import { Fact, RecapSection, RecapTitleLink } from "./RecapBlocks";

type RecapRhythmProps = { review: YearReview; now: Date };

// When they watched: months, the busiest one, the longest daily streak, first and last watch.
export const RecapRhythm = ({ review, now }: RecapRhythmProps) => {
  const busiest = review.busiestMonth;
  const streak = review.longestStreak;
  const title = busiest
    ? `${MONTH_NAMES[busiest.month - 1]} was the busiest month: ${plural(busiest.count, "log")}.`
    : "A year in logs.";

  return (
    <RecapSection label="Rhythm" year={review.year} title={title}>
      <div className="mt-8">
        <MonthBars months={toMonthBars(review)} />
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        {streak ? (
          <Fact label="Longest streak">
            <p className="display-2 text-foreground">{plural(streak.days, "day")}</p>
            <p className="mono-meta text-[10px] text-muted-foreground uppercase">
              {streak.days === 1 ? formatDay(streak.start) : `${formatDay(streak.start)} – ${formatDay(streak.end)}`}
            </p>
          </Fact>
        ) : null}
        {review.firstWatch ? (
          <Fact label="First watch">
            <RecapTitleLink title={review.firstWatch} meta={formatDay(review.firstWatch.watchedDate)} />
          </Fact>
        ) : null}
        {review.lastWatch ? (
          <Fact label={review.isPartialYear ? "Latest watch" : "Last watch"}>
            <RecapTitleLink title={review.lastWatch} meta={formatDay(review.lastWatch.watchedDate)} />
          </Fact>
        ) : null}
      </div>
      <div className="mt-8">
        <DayHeatmap weeks={toDayHeatmap(review.logsPerDay, heatmapEnd(review, now))} year={review.year} />
      </div>
    </RecapSection>
  );
};
