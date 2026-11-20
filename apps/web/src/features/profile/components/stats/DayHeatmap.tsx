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
// Below this a column is too thin to read, so narrow screens scroll instead.
const MIN_CELL_PX = 9;
const GAP_PX = 3;

// Opens on the latest logged day, which matters when a narrow screen scrolls the year.
const scrollToLatest = (node: HTMLDivElement | null) => {
  if (!node) return;
  const latest = [...node.querySelectorAll<HTMLElement>("[data-day]:not([data-future])")].at(-1);
  node.scrollLeft = latest ? latest.offsetLeft + latest.offsetWidth * 4 - node.clientWidth : node.scrollWidth;
};

const LegendCell = ({ level }: { level: HeatLevel }) => (
  <i className={cn("block size-[11px] rounded-[2px]", LEVEL_CLASS[level])} />
);

// GitHub-style year of days: a column per week, Monday on top, brighter with more logs.
// Columns stretch to fill the width; days still to come stay faint.
export const DayHeatmap = ({ weeks, year }: { weeks: HeatWeek[]; year: number }) => {
  const total = weeks.reduce((sum, week) => sum + week.days.reduce((days, day) => days + (day?.count ?? 0), 0), 0);

  return (
    <div>
      <div ref={scrollToLatest} className="relative overflow-x-auto pb-1">
        <div
          role="group"
          aria-label={`${year} in reels: ${total} logs`}
          className="grid grid-flow-col grid-rows-[12px_repeat(7,auto)]"
          style={{
            gap: GAP_PX,
            gridTemplateColumns: `auto repeat(${weeks.length}, minmax(${MIN_CELL_PX}px, 1fr))`,
            minWidth: weeks.length * (MIN_CELL_PX + GAP_PX) + 28,
          }}
        >
          <span aria-hidden />
          {WEEKDAY_LABELS.map((label, index) => (
            <span key={index} aria-hidden className="mono-meta self-center pr-1 text-[9px] leading-none text-muted-foreground">
              {label}
            </span>
          ))}
          {weeks.map((week) => [
            <span key={`${week.key}-month`} aria-hidden className="relative">
              <span className="mono-meta absolute left-0 whitespace-nowrap text-[9px] leading-[12px] text-muted-foreground">
                {week.month ?? ""}
              </span>
            </span>,
            ...week.days.map((day, index) =>
              day ? (
                <i
                  key={day.key}
                  data-day
                  data-future={day.future ? "" : undefined}
                  role={day.future ? undefined : "img"}
                  aria-label={day.future ? undefined : day.label}
                  title={day.future ? undefined : day.label}
                  className={cn("block aspect-square w-full rounded-[2px]", LEVEL_CLASS[day.level], day.future && "opacity-35")}
                />
              ) : (
                <span key={`${week.key}-${index}`} aria-hidden />
              ),
            ),
          ])}
        </div>
      </div>
      <div aria-hidden className="mono-meta mt-1.5 flex items-center justify-end gap-[3px] text-[9px] text-muted-foreground">
        <span className="mr-1">Less</span>
        {([0, 1, 2, 3, 4] as const).map((level) => (
          <LegendCell key={level} level={level} />
        ))}
        <span className="ml-1">More</span>
      </div>
    </div>
  );
};
