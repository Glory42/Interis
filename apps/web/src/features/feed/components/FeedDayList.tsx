import { Link } from "@tanstack/react-router";
import { FeedActivityCard } from "@/features/feed/components/FeedActivityCard";
import { FeedTitleCard } from "@/features/feed/components/FeedTitleCard";
import type { FeedDay, FeedRow } from "@/features/feed/components/feed-days";
import { getPosterUrl } from "@/features/movies/components/utils";

type FeedDayListProps = {
  isLoading: boolean;
  isError: boolean;
  days: FeedDay[];
};

const FeedSkeletonRow = () => (
  <div className="flex animate-pulse gap-3 rounded-[3px] border border-[color:var(--line)] p-3">
    <div className="aspect-2/3 w-[62px] shrink-0 rounded-[2px] bg-muted/40" />
    <div className="min-w-0 flex-1 space-y-2.5 pt-1">
      <div className="h-3 w-24 rounded bg-muted/40" />
      <div className="h-4 w-48 rounded bg-muted/35" />
      <div className="h-3 w-2/3 rounded bg-muted/20" />
    </div>
  </div>
);

const LikesLine = ({ row }: { row: Extract<FeedRow, { kind: "likes" }> }) => (
  <div className="flex items-center gap-2 rounded-[3px] border border-[color:var(--line)] px-3 py-2 text-xs">
    <Link to="/profile/$username" params={{ username: row.actor.username }} className="font-semibold text-foreground">
      {row.actor.username}
    </Link>
    <span className="text-muted-foreground">{`liked ${row.titles.length} titles`}</span>
    <span className="ml-auto flex min-w-0 items-center gap-1.5">
      {row.titles.slice(0, 3).map((title) => (
        <img key={title.tmdbId} src={getPosterUrl(title.posterPath)} alt="" className="aspect-2/3 w-[18px] rounded-[1px] object-cover" />
      ))}
      <span className="mono-meta truncate text-muted-foreground">{row.titles.map((title) => title.title).join(", ")}</span>
    </span>
  </div>
);

const renderRow = (row: FeedRow) => {
  if (row.kind === "title") return <FeedTitleCard key={row.key} group={row.group} />;
  if (row.kind === "likes") return <LikesLine key={row.key} row={row} />;
  return <FeedActivityCard key={row.key} item={row.item} />;
};

// The feed as days: a slate line per day, then one card per watch and one line per run of likes.
export const FeedDayList = ({ isLoading, isError, days }: FeedDayListProps) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }, (_, index) => (
          <FeedSkeletonRow key={index} />
        ))}
      </div>
    );
  }

  if (isError) {
    return <p className="body-s border-l-2 border-[color:var(--danger)]/50 pl-4 text-[color:var(--danger)]">Could not load your feed right now.</p>;
  }

  if (days.length === 0) {
    return <p className="body-s border-l-2 border-[color:var(--line)] pl-4 text-muted-foreground">Nothing here yet for this filter.</p>;
  }

  return (
    <div className="space-y-5">
      {days.map((day) => (
        <section key={day.key} aria-label={day.label}>
          <div className="slate mono-meta mb-2.5 uppercase">
            <span>{day.label}</span>
            <span>{day.week}</span>
          </div>
          <div className="space-y-2">{day.rows.map(renderRow)}</div>
        </section>
      ))}
    </div>
  );
};
