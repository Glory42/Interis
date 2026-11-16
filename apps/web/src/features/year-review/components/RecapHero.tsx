import type { ReactNode } from "react";
import type { YearReview } from "@/features/year-review/api";
import { compareWith, formatCount, plural, yearHeading } from "@/features/year-review/year-review-model";
import { BigStat } from "./RecapBlocks";

type RecapHeroProps = { review: YearReview; isOwner: boolean; actions: ReactNode };

// The year in three numbers, against last year's when there is one.
export const RecapHero = ({ review, isOwner, actions }: RecapHeroProps) => {
  const { totals, previousYear: previous } = review;
  const compare = (current: number, before: number | undefined) =>
    previous && before !== undefined ? compareWith(current, before, review.year - 1) : null;
  const name = review.user.displayName;

  return (
    <header className="animate-fade-up pb-10">
      <p className="kicker text-primary">Year in review</p>
      <h1 className="mt-2 font-display text-6xl leading-[0.92] font-bold tracking-tight text-foreground sm:text-8xl">
        {yearHeading(review)}
      </h1>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">{actions}</div>

      {review.depth === "empty" ? (
        <p className="body mt-10 max-w-md text-muted-foreground">
          {isOwner
            ? `Nothing logged in ${review.year} yet. Every Diary Entry dated in ${review.year} lands here.`
            : `${name} hasn't logged anything in ${review.year}.`}
        </p>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3">
          <BigStat value={formatCount(totals.films)} label={totals.films === 1 ? "film" : "films"} detail={compare(totals.films, previous?.films)} tone="film" />
          <BigStat value={formatCount(totals.series)} label="series" detail={compare(totals.series, previous?.series)} tone="series" />
          <BigStat
            value={`${formatCount(totals.hoursWatched)}h`}
            label="watched"
            detail={compare(totals.hoursWatched, previous?.hoursWatched) ?? `${formatCount(totals.filmHours)}h film · ${formatCount(totals.seriesHours)}h tv`}
            tone="primary"
          />
        </div>
      )}
      {review.depth !== "empty" ? (
        <p className="mono-meta mt-6 text-[10px] text-muted-foreground uppercase">
          {`${plural(totals.logs, "diary entry", "diary entries")}${totals.rewatchLogs > 0 ? ` · ${plural(totals.rewatchLogs, "rewatch", "rewatches")}` : ""}${totals.episodes > 0 ? ` · ${plural(totals.episodes, "episode")}` : ""}`}
        </p>
      ) : null}
    </header>
  );
};
