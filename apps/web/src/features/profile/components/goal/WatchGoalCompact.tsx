import { Link } from "@tanstack/react-router";
import { useWatchGoal } from "@/features/profile/hooks/useWatchGoal";
import { GoalBar } from "./GoalBar";

type WatchGoalCompactProps = {
  username: string;
  isOwner: boolean;
  now?: Date;
};

// The overview's glance at this year's goal; the Stats page holds the detail and the editor.
export const WatchGoalCompact = ({ username, isOwner, now }: WatchGoalCompactProps) => {
  const year = (now ?? new Date()).getFullYear();
  const { data } = useWatchGoal(username, year);
  if (!data) return null;

  if (!data.goal) {
    return isOwner ? (
      <Link
        to="/profile/$username/stats"
        params={{ username }}
        className="mono-meta inline-block text-[11px] uppercase text-muted-foreground hover:text-foreground"
      >
        {`Set a ${year} watch goal →`}
      </Link>
    ) : null;
  }

  return (
    <Link
      to="/profile/$username/stats"
      params={{ username }}
      aria-label={`${year} watch goal: ${data.films.watched} of ${data.goal.targetFilms} films`}
      className="block rounded-[3px] border border-[color:var(--line)] p-3 transition-colors hover:border-[color:var(--line-strong)]"
    >
      <p className="kicker mb-2 text-muted-foreground">{`${year} goal`}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <GoalBar label="Films" watched={data.films.watched} target={data.goal.targetFilms} pace={data.films.pace} tone="film" />
        {data.goal.targetSeries !== null ? (
          <GoalBar label="Series" watched={data.series.watched} target={data.goal.targetSeries} pace={data.series.pace} tone="series" />
        ) : null}
      </div>
    </Link>
  );
};
