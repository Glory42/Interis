import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { MeFeedSummary } from "@/features/feed/types";

type FeedGoalReachedProps = {
  userId: string;
  username: string;
  goal: NonNullable<MeFeedSummary["goal"]>;
};

const seenKey = (userId: string, year: number) => `interis:goal-reached:${userId}:${year}`;

// Storage errors just mean the note may show again.
const hasSeen = (key: string): boolean => {
  try {
    return window.localStorage.getItem(key) !== null;
  } catch {
    return false;
  }
};

const markSeen = (key: string) => {
  try {
    window.localStorage.setItem(key, "1");
  } catch {
    // ignore
  }
};

// A one-off note on the feed load after this year's goal is reached; remembered per browser, no table.
export const FeedGoalReached = ({ userId, username, goal }: FeedGoalReachedProps) => {
  const key = seenKey(userId, goal.year);
  const [isVisible, setIsVisible] = useState(() => goal.reached && !hasSeen(key));

  useEffect(() => {
    if (isVisible) markSeen(key);
  }, [isVisible, key]);

  if (!isVisible) return null;

  return (
    <section
      role="status"
      aria-label={`${goal.year} goal reached`}
      className="animate-fade-up mb-4 flex items-start gap-3 rounded-[3px] border border-[color:var(--line)] p-3"
    >
      <div className="min-w-0 flex-1">
        <p className="kicker text-[color:var(--film)]">{`${goal.year} goal reached`}</p>
        <p className="body-s mt-1 text-foreground">
          {`${goal.filmsWatched.toLocaleString("en-US")} of ${goal.targetFilms.toLocaleString("en-US")} films`}
          {goal.targetSeries !== null ? ` and ${goal.seriesWatched} of ${goal.targetSeries} series` : ""}
          {" logged this year. "}
          <Link to="/profile/$username/stats" params={{ username }} className="text-muted-foreground underline hover:text-foreground">
            See your year
          </Link>
        </p>
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => setIsVisible(false)}
        className="shrink-0 text-muted-foreground hover:text-foreground"
      >
        <X aria-hidden className="size-4" />
      </button>
    </section>
  );
};
