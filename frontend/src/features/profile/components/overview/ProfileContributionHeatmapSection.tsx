import { useMemo, useState } from "react";
import type {
  UserContributionCalendar,
  UserContributionDay,
} from "@/features/profile/api";
import {
  buildContributionMonthLabels,
  buildContributionSummaryLabel,
  buildContributionStreaks,
  buildContributionTooltipLabel,
  buildContributionWeeks,
  buildContributionIntensityThresholds,
  contributionMaskByMediaType,
  contributionMediaLabel,
  contributionMediaOrder,
  contributionWeekdayLabels,
  formatContributionDate,
  formatContributionCountLabel,
  getContributionMediaTypesForDay,
  resolveContributionCellColor,
  resolveContributionLegendColor,
} from "./profileContributionHeatmap.utils";

type ProfileContributionHeatmapSectionProps = {
  calendar: UserContributionCalendar | null;
  isPending: boolean;
  isError: boolean;
};

const ActiveDayDetails = ({ day }: { day: UserContributionDay }) => {
  if (day.totalCount === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        {formatContributionDate(day.date)} · No contributions
      </p>
    );
  }

  const mediaTypes = getContributionMediaTypesForDay(day)
    .map((mediaType) => contributionMediaLabel[mediaType])
    .join(", ");

  return (
    <div className="space-y-1 text-xs">
      <p className="font-medium text-foreground">
        {formatContributionDate(day.date)} ·{" "}
        {formatContributionCountLabel(day.totalCount)}
      </p>
      <p className="text-muted-foreground">
        {day.logCount} logs · {day.reviewCount} reviews
      </p>
      <p className="text-muted-foreground">Media types: {mediaTypes}</p>
    </div>
  );
};

export const ProfileContributionHeatmapSection = ({
  calendar,
  isPending,
  isError,
}: ProfileContributionHeatmapSectionProps) => {
  const [activeDate, setActiveDate] = useState<string | null>(null);

  const contributionDays = useMemo(
    () => calendar?.days ?? [],
    [calendar?.days],
  );
  const intensityThresholds = useMemo(
    () => buildContributionIntensityThresholds(contributionDays),
    [contributionDays],
  );
  const weeks = useMemo(
    () => buildContributionWeeks(contributionDays),
    [contributionDays],
  );
  const monthLabels = useMemo(
    () => buildContributionMonthLabels(weeks),
    [weeks],
  );
  const dayByDate = useMemo(
    () => new Map(contributionDays.map((day) => [day.date, day])),
    [contributionDays],
  );
  const activeDay = activeDate ? (dayByDate.get(activeDate) ?? null) : null;
  const streaks = useMemo(
    () => buildContributionStreaks(contributionDays),
    [contributionDays],
  );

  if (isPending) {
    return (
      <div className="space-y-3">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          Contribution Activity
        </h3>
        <div className=" border border-border/70 bg-card/25 p-3 text-sm text-muted-foreground">
          Loading contribution history...
        </div>
      </div>
    );
  }

  if (isError || !calendar) {
    return (
      <div className="space-y-3">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          Contribution Activity
        </h3>
        <div className=" border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          Could not load contribution history.
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
        Contribution Activity
      </h3>

      <div className=" border border-border/60 bg-card/20 p-3.5">
        <p className="mb-3 text-xs text-muted-foreground">
          {buildContributionSummaryLabel(calendar)}
        </p>

        <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className=" border border-border/60 bg-background/25 px-3 py-2 text-center">
            <p className="text-sm font-semibold text-foreground">
              {calendar.totals.activeDays}
            </p>
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Active Days
            </p>
          </div>
          <div className=" border border-border/60 bg-background/25 px-3 py-2 text-center">
            <p className="text-sm font-semibold text-foreground">{streaks.current}</p>
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Current Streak
            </p>
          </div>
          <div className=" border border-border/60 bg-background/25 px-3 py-2 text-center">
            <p className="text-sm font-semibold text-foreground">{streaks.longest}</p>
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Longest Streak
            </p>
          </div>
        </div>

        <div className="no-scrollbar overflow-x-auto">
          <div className="inline-flex min-w-max gap-3">
            <div className="pt-5">
              <div className="grid grid-rows-7 gap-1 text-[10px] text-muted-foreground/85">
                {contributionWeekdayLabels.map((label, rowIndex) => (
                  <span
                    key={`contribution-weekday-${rowIndex}`}
                    className="flex h-3 items-center"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-1 grid grid-flow-col auto-cols-max gap-1 text-[10px] text-muted-foreground/85">
                {monthLabels.map((monthLabel, index) => (
                  <span
                    key={`contribution-month-${index}`}
                    className="w-3 overflow-visible whitespace-nowrap"
                  >
                    {monthLabel}
                  </span>
                ))}
              </div>

              <div className="grid grid-flow-col auto-cols-max gap-1">
                {weeks.map((week, weekIndex) => (
                  <div
                    key={`contribution-week-${weekIndex}`}
                    className="grid grid-rows-7 gap-1"
                  >
                    {week.map((day, dayIndex) => {
                      if (!day) {
                        return (
                          <span
                            key={`contribution-empty-${weekIndex}-${dayIndex}`}
                            className="h-3 w-3"
                          />
                        );
                      }

                      const dayColor = resolveContributionCellColor(
                        day.mediaMask,
                        day.totalCount,
                        intensityThresholds,
                      );

                      return (
                        <button
                          key={`contribution-day-${day.date}`}
                          type="button"
                          title={buildContributionTooltipLabel(day)}
                          aria-label={buildContributionTooltipLabel(day)}
                          className="h-3 w-3  border border-border/45 bg-muted/35 transition-transform hover:scale-110 focus-visible:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
                          style={
                            dayColor ? { backgroundColor: dayColor } : undefined
                          }
                          onMouseEnter={() => setActiveDate(day.date)}
                          onFocus={() => setActiveDate(day.date)}
                          onMouseLeave={() => {
                            setActiveDate((current) =>
                              current === day.date ? null : current,
                            );
                          }}
                          onBlur={() => {
                            setActiveDate((current) =>
                              current === day.date ? null : current,
                            );
                          }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
            {contributionMediaOrder.map((mediaType) => (
              <span
                key={`contribution-media-${mediaType}`}
                className="inline-flex items-center gap-1.5"
              >
                <span
                  className="h-2.5 w-2.5  border border-border/45"
                  style={{
                    backgroundColor: resolveContributionLegendColor(
                      contributionMaskByMediaType[mediaType],
                      4,
                    ),
                  }}
                />
                {contributionMediaLabel[mediaType]}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span>Less</span>
            {[1, 2, 3, 4].map((level) => (
              <span
                key={`contribution-level-${level}`}
                className="h-2.5 w-2.5  border border-border/45"
                style={{
                  backgroundColor: resolveContributionLegendColor(
                    1,
                    level as 1 | 2 | 3 | 4,
                  ),
                }}
              />
            ))}
            <span>More</span>
          </div>

          <div className=" border border-border/60 bg-background/25 px-3 py-2.5">
            {activeDay ? (
              <ActiveDayDetails day={activeDay} />
            ) : (
              <p className="text-xs text-muted-foreground">
                Hover or focus a day to inspect its contribution breakdown.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
