import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { WatchGoal } from "@/features/profile/goal-api";
import { useWatchGoal } from "@/features/profile/hooks/useWatchGoal";
import { GoalBar } from "./GoalBar";
import { WatchGoalEditor } from "./WatchGoalEditor";
import { filmCountLabel, goalStateOf, type GoalState } from "./goal-model";

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

const GoalProgress = ({ data }: { data: WatchGoal & { goal: NonNullable<WatchGoal["goal"]> } }) => {
  const state = goalStateOf(data);
  return (
    <div data-goal-state={state}>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
        <p className="display-2 leading-none text-foreground">
          {data.films.watched.toLocaleString("en-US")}
          <span className="text-muted-foreground">{` / ${data.goal.targetFilms.toLocaleString("en-US")}`}</span>
        </p>
        {STATE_LABEL[state] ? (
          <p className={state === "reached" ? "kicker text-primary" : "kicker text-muted-foreground"}>{STATE_LABEL[state]}</p>
        ) : null}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <GoalBar label="Films" watched={data.films.watched} target={data.goal.targetFilms} pace={data.films.pace} tone="film" />
        {data.goal.targetSeries !== null ? (
          <GoalBar label="Series" watched={data.series.watched} target={data.goal.targetSeries} pace={data.series.pace} tone="series" />
        ) : null}
      </div>
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

  return (
    <section aria-label="Watch goal">
      <div className="mb-2 flex min-h-4 items-center justify-between gap-3">
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
        <div data-goal-state="none" className="flex flex-wrap items-center justify-between gap-3">
          <p className="body-s text-muted-foreground">
            {isOwner
              ? `${filmCountLabel(data.films.watched)} logged in ${year}. How many will you watch?`
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
