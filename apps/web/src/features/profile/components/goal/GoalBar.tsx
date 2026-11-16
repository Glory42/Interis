import { cn } from "@/lib/utils";
import type { WatchGoalProgress } from "@/features/profile/goal-api";
import { paceLabel, showsPaceMarker } from "./goal-model";

type GoalBarProps = {
  label: string;
  watched: number;
  target: number;
  pace: WatchGoalProgress["pace"];
  tone: "film" | "series";
};

// A thin bar in the media's tone; the hairline marks where a steady pace would be today.
export const GoalBar = ({ label, watched, target, pace, tone }: GoalBarProps) => {
  const percent = Math.min(100, (watched / target) * 100);
  const isDone = pace?.status === "reached";
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="kicker text-muted-foreground">{label}</span>
        <span className="mono-meta text-[11px] text-foreground">{`${watched} / ${target}`}</span>
      </div>
      <div
        role="progressbar"
        aria-label={`${label}: ${watched} of ${target}`}
        aria-valuemin={0}
        aria-valuemax={target}
        aria-valuenow={Math.min(watched, target)}
        className="relative mt-1 h-1.5 rounded-[1px] bg-foreground/12"
      >
        <span
          className={cn(
            "absolute inset-y-0 left-0 rounded-[1px]",
            tone === "film" ? "bg-[color:var(--film)]" : "bg-[color:var(--series)]",
          )}
          style={{ width: `${percent}%` }}
        />
        {showsPaceMarker(pace) ? (
          <span
            aria-hidden
            className="absolute -inset-y-0.5 w-px bg-foreground"
            style={{ left: `${Math.min(100, (pace.expected / target) * 100)}%` }}
          />
        ) : null}
      </div>
      {pace ? (
        <p
          className={cn(
            "mono-meta mt-1 text-[10px] uppercase",
            isDone ? (tone === "film" ? "text-[color:var(--film)]" : "text-[color:var(--series)]") : "text-muted-foreground",
          )}
        >
          {paceLabel(pace)}
        </p>
      ) : null}
    </div>
  );
};
