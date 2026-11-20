import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { WatchGoal } from "@/features/profile/goal-api";
import { useWatchGoal } from "@/features/profile/hooks/useWatchGoal";
import { GoalBar } from "./GoalBar";
import { WatchGoalEditor } from "./WatchGoalEditor";
import { filmCountLabel, goalStateOf, tvCountLabel, type GoalState } from "./goal-model";

type WatchGoalCardProps = {
  username: string;
  isOwner: boolean;
  now?: Date;
};

const STATE_LABEL: Partial<Record<GoalState, string>> = {
  reached: "Goal reached",
  missed: "Goal missed",
  behind: "Behind pace",
  upcoming: "Not started",
};

// Each target gets its own count and bar; a lone target spans the whole row.
const GoalProgress = ({ data }: { data: WatchGoal & { goal: NonNullable<WatchGoal["goal"]> } }) => {
  const { targetFilms, targetSeries } = data.goal;
  return (
    <div className={cn("grid gap-x-10 gap-y-6", targetFilms !== null && targetSeries !== null && "sm:grid-cols-2")}>
      {targetFilms !== null ? (
        <GoalBar label="Films" watched={data.films.watched} target={targetFilms} pace={data.films.pace} tone="film" />
      ) : null}
      {targetSeries !== null ? (
        <GoalBar label="TV" watched={data.series.watched} target={targetSeries} pace={data.series.pace} tone="series" />
      ) : null}
    </div>
  );
};

// The Stats page's yearly goal: progress, pace, past years and the owner's inline editor.
export const WatchGoalCard = ({ username, isOwner, now }: WatchGoalCardProps) => {
  const currentYear = (now ?? new Date()).getFullYear();
  const [year, setYear] = useState(currentYear);
  const [isEditing, setIsEditing] = useState(false);
  const goalQuery = useWatchGoal(username, year);
  const data = goalQuery.data;

  if (!data) return null;
  if (!data.goal && !isOwner && data.years.length === 0) return null;

  const years = [...new Set([currentYear, ...data.years.map((row) => row.year)])].sort((a, b) => b - a);
  const state = goalStateOf(data);
  const stateLabel = data.goal && !isEditing ? STATE_LABEL[state] : undefined;

  return (
    <section aria-label="Watch goal" data-goal-state={state}>
      <div className="mb-4 flex min-h-4 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {years.length > 1 ? (
            <select
              aria-label="Goal year"
              value={year}
              onChange={(event) => {
                setYear(Number(event.target.value));
                setIsEditing(false);
              }}
              className="kicker cursor-pointer bg-transparent text-muted-foreground hover:text-foreground"
            >
              {years.map((option) => (
                <option key={option} value={option}>{`${option} goal`}</option>
              ))}
            </select>
          ) : (
            <p className="kicker text-muted-foreground">{`${year} goal`}</p>
          )}
          {stateLabel ? (
            <>
              <span aria-hidden className="kicker text-muted-foreground">·</span>
              <p className={cn("kicker", state === "reached" ? "text-primary" : "text-muted-foreground")}>{stateLabel}</p>
            </>
          ) : null}
        </div>
        {isOwner && data.goal && !isEditing ? (
          <Button variant="link" size="sm" onClick={() => setIsEditing(true)}>
            Edit goal
          </Button>
        ) : null}
      </div>

      {isEditing ? (
        <WatchGoalEditor key={year} year={year} goal={data.goal} onDone={() => setIsEditing(false)} />
      ) : data.goal ? (
        <GoalProgress data={{ ...data, goal: data.goal }} />
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="body-s text-muted-foreground">
            {isOwner
              ? `${filmCountLabel(data.films.watched)} and ${tvCountLabel(data.series.watched)} logged in ${year}. How many will you watch?`
              : `No goal for ${year}.`}
          </p>
          {isOwner ? (
            <Button size="sm" onClick={() => setIsEditing(true)}>
              Set a goal
            </Button>
          ) : null}
        </div>
      )}
    </section>
  );
};
