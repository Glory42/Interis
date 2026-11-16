import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { fieldInput } from "@/features/settings/components/account/AccountField";
import { WATCH_GOAL_MAX_TARGET, type WatchGoal } from "@/features/profile/goal-api";
import { useClearWatchGoal, useSetWatchGoal } from "@/features/profile/hooks/useWatchGoal";

type WatchGoalEditorProps = {
  year: number;
  goal: WatchGoal["goal"];
  onDone: () => void;
};

// A whole number from 1 to the cap, or undefined when the field is invalid.
const parseTarget = (raw: string): number | undefined => {
  const value = Number(raw.trim());
  return Number.isInteger(value) && value >= 1 && value <= WATCH_GOAL_MAX_TARGET ? value : undefined;
};

// Inline form for the owner: a Film target and an optional Series one.
export const WatchGoalEditor = ({ year, goal, onDone }: WatchGoalEditorProps) => {
  const [films, setFilms] = useState(goal ? String(goal.targetFilms) : "");
  const [series, setSeries] = useState(goal?.targetSeries ? String(goal.targetSeries) : "");
  const save = useSetWatchGoal();
  const clear = useClearWatchGoal();

  const targetFilms = parseTarget(films);
  const targetSeries = series.trim() === "" ? null : parseTarget(series);
  const isValid = targetFilms !== undefined && targetSeries !== undefined;
  const failed = save.isError || clear.isError;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (targetFilms === undefined || targetSeries === undefined) return;
    save.mutate({ year, input: { targetFilms, targetSeries } }, { onSuccess: onDone });
  };

  return (
    <form aria-label={`${year} watch goal`} onSubmit={submit} className="animate-fade-up">
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="kicker mb-1 block text-muted-foreground">Films</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={WATCH_GOAL_MAX_TARGET}
            required
            value={films}
            onChange={(event) => setFilms(event.target.value)}
            placeholder="52"
            className={fieldInput}
          />
        </label>
        <label className="block">
          <span className="kicker mb-1 block text-muted-foreground">Series · optional</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={WATCH_GOAL_MAX_TARGET}
            value={series}
            onChange={(event) => setSeries(event.target.value)}
            placeholder="—"
            className={fieldInput}
          />
        </label>
      </div>
      <p className="mono-meta mt-1 text-[10px] text-muted-foreground">
        {`Distinct titles you log in ${year}; rewatches count once. Up to ${WATCH_GOAL_MAX_TARGET.toLocaleString("en-US")}.`}
      </p>
      {failed ? (
        <p role="alert" className="body-s mt-2 text-[color:var(--danger)]">
          Could not save the goal. Try again.
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button type="submit" size="sm" loading={save.isPending} disabled={!isValid || clear.isPending}>
          Save goal
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          Cancel
        </Button>
        {goal ? (
          <Button
            type="button"
            variant="danger"
            size="sm"
            className="ml-auto"
            loading={clear.isPending}
            disabled={save.isPending}
            onClick={() => clear.mutate(year, { onSuccess: onDone })}
          >
            Remove
          </Button>
        ) : null}
      </div>
    </form>
  );
};
