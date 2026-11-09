import { cn } from "@/lib/utils";
import type { HeatLevel, HeatWeek } from "./day-heatmap-model";

const LEVEL_CLASS: Record<HeatLevel, string> = {
  0: "bg-[color:var(--line)]",
  1: "bg-primary/25",
  2: "bg-primary/50",
  3: "bg-primary/75",
  4: "bg-primary",
};
const WEEKDAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", ""];
const GRID_ROWS = "grid-rows-[12px_repeat(7,11px)]";

// Opens on the latest weeks; the module-level ref callback runs once, on mount.
const scrollToLatest = (node: HTMLDivElement | null) => {
  if (node) node.scrollLeft = node.scrollWidth;
};

const Cell = ({ level, label }: { level: HeatLevel; label?: string }) => (
  <i role={label ? "img" : undefined} aria-label={label} title={label} className={cn("block size-[11px] rounded-[2px]", LEVEL_CLASS[level])} />
);

// GitHub-style year of days: a column per week, Monday on top, brighter with more logs.
export const DayHeatmap = ({ weeks, year }: { weeks: HeatWeek[]; year: number }) => {
  const total = weeks.reduce((sum, week) => sum + week.days.reduce((days, day) => days + (day?.count ?? 0), 0), 0);

  return (
    <div>
      <div className="flex gap-1.5">
        <div aria-hidden className={cn("grid shrink-0 gap-[2px]", GRID_ROWS)}>
          <span />
          {WEEKDAY_LABELS.map((label, index) => (
            <span key={index} className="mono-meta text-[9px] leading-[11px] text-muted-foreground">{label}</span>
          ))}
        </div>
        <div ref={scrollToLatest} className="min-w-0 overflow-x-auto pb-1">
          <div
            role="group"
            aria-label={`${year} in reels: ${total} logs`}
            className={cn("grid w-max auto-cols-[11px] grid-flow-col gap-[2px]", GRID_ROWS)}
          >
            {weeks.map((week) => [
              <span key={`${week.key}-month`} aria-hidden className="mono-meta whitespace-nowrap text-[9px] leading-[12px] text-muted-foreground">
                {week.month ?? ""}
              </span>,
              ...week.days.map((day, index) =>
                day ? (
                  <Cell key={day.key} level={day.level} label={day.label} />
                ) : (
                  <span key={`${week.key}-${index}`} aria-hidden />
                ),
              ),
            ])}
          </div>
        </div>
      </div>
      <div aria-hidden className="mono-meta mt-1.5 flex items-center justify-end gap-[3px] text-[9px] text-muted-foreground">
        <span className="mr-1">Less</span>
        {([0, 1, 2, 3, 4] as const).map((level) => (
          <Cell key={level} level={level} />
        ))}
        <span className="ml-1">More</span>
      </div>
    </div>
  );
};
