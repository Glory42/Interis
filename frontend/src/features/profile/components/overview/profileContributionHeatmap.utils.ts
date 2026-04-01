import type {
  UserContributionCalendar,
  UserContributionDay,
  UserContributionMediaType,
} from "@/features/profile/api";

export type ContributionIntensityThresholds = {
  low: number;
  medium: number;
  high: number;
};

export type ContributionWeek = Array<UserContributionDay | null>;

const monthLabelFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  timeZone: "UTC",
});

const dayLabelFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const intensityAlphaByLevel: Record<0 | 1 | 2 | 3 | 4, number> = {
  0: 0,
  1: 0.52,
  2: 0.68,
  3: 0.84,
  4: 1,
};

const colorVariableByMask: Record<number, string> = {
  1: "--heatmap-mask-1-rgb",
  2: "--heatmap-mask-2-rgb",
  3: "--heatmap-mask-3-rgb",
  4: "--heatmap-mask-4-rgb",
  5: "--heatmap-mask-5-rgb",
  6: "--heatmap-mask-6-rgb",
  7: "--heatmap-mask-7-rgb",
  8: "--heatmap-mask-8-rgb",
  9: "--heatmap-mask-9-rgb",
  10: "--heatmap-mask-10-rgb",
  11: "--heatmap-mask-11-rgb",
  12: "--heatmap-mask-12-rgb",
  13: "--heatmap-mask-13-rgb",
  14: "--heatmap-mask-14-rgb",
  15: "--heatmap-mask-15-rgb",
};

const toUtcDate = (dateKey: string): Date => {
  return new Date(`${dateKey}T00:00:00.000Z`);
};

const percentile = (sorted: number[], percentileValue: number): number => {
  if (sorted.length === 0) {
    return 0;
  }

  const index = Math.ceil(percentileValue * sorted.length) - 1;
  const boundedIndex = Math.max(0, Math.min(sorted.length - 1, index));
  return sorted[boundedIndex] ?? 0;
};

export const contributionMediaOrder: UserContributionMediaType[] = [
  "film",
  "tv",
  "book",
  "music",
];

export const contributionMediaLabel: Record<UserContributionMediaType, string> = {
  film: "Film",
  tv: "TV",
  book: "Book",
  music: "Music",
};

export const contributionMaskByMediaType: Record<UserContributionMediaType, number> = {
  film: 1,
  tv: 2,
  book: 4,
  music: 8,
};

export const contributionWeekdayLabels = ["", "Mon", "", "Wed", "", "Fri", ""] as const;

export const buildContributionIntensityThresholds = (
  days: UserContributionDay[],
): ContributionIntensityThresholds => {
  const nonZeroCounts = days
    .map((day) => day.totalCount)
    .filter((count) => count > 0)
    .sort((left, right) => left - right);

  if (nonZeroCounts.length === 0) {
    return { low: 0, medium: 0, high: 0 };
  }

  return {
    low: percentile(nonZeroCounts, 0.25),
    medium: percentile(nonZeroCounts, 0.5),
    high: percentile(nonZeroCounts, 0.75),
  };
};

export const resolveContributionIntensityLevel = (
  totalCount: number,
  thresholds: ContributionIntensityThresholds,
): 0 | 1 | 2 | 3 | 4 => {
  if (totalCount <= 0) {
    return 0;
  }

  if (totalCount <= thresholds.low) {
    return 1;
  }

  if (totalCount <= thresholds.medium) {
    return 2;
  }

  if (totalCount <= thresholds.high) {
    return 3;
  }

  return 4;
};

export const resolveContributionCellColor = (
  mediaMask: number,
  totalCount: number,
  thresholds: ContributionIntensityThresholds,
): string | null => {
  if (mediaMask === 0 || totalCount <= 0) {
    return null;
  }

  const colorVariable = colorVariableByMask[mediaMask] ?? colorVariableByMask[15];
  const intensityLevel = resolveContributionIntensityLevel(totalCount, thresholds);
  const alpha = intensityAlphaByLevel[intensityLevel];

  return `rgb(var(${colorVariable}) / ${alpha})`;
};

export const resolveContributionLegendColor = (
  mediaMask: number,
  intensityLevel: 1 | 2 | 3 | 4,
): string => {
  const colorVariable = colorVariableByMask[mediaMask] ?? colorVariableByMask[15];
  const alpha = intensityAlphaByLevel[intensityLevel];
  return `rgb(var(${colorVariable}) / ${alpha})`;
};

export const buildContributionWeeks = (
  days: UserContributionDay[],
): ContributionWeek[] => {
  const weeks: ContributionWeek[] = [];
  let currentWeek: ContributionWeek = Array.from({ length: 7 }, () => null);

  for (const day of days) {
    const date = toUtcDate(day.date);
    const dayOfWeek = date.getUTCDay();
    currentWeek[dayOfWeek] = day;

    if (dayOfWeek === 6) {
      weeks.push(currentWeek);
      currentWeek = Array.from({ length: 7 }, () => null);
    }
  }

  if (currentWeek.some((day) => day !== null)) {
    weeks.push(currentWeek);
  }

  return weeks;
};

export const buildContributionMonthLabels = (weeks: ContributionWeek[]): string[] => {
  const labels: string[] = [];
  let previousMonth: number | null = null;

  for (const week of weeks) {
    const firstDay = week.find((day) => day !== null);
    if (!firstDay) {
      labels.push("");
      continue;
    }

    const firstDayDate = toUtcDate(firstDay.date);
    const monthIndex = firstDayDate.getUTCMonth();

    if (previousMonth === null || monthIndex !== previousMonth) {
      labels.push(monthLabelFormatter.format(firstDayDate));
      previousMonth = monthIndex;
    } else {
      labels.push("");
    }
  }

  return labels;
};

export const getContributionMediaTypesForDay = (
  day: UserContributionDay,
): UserContributionMediaType[] => {
  return contributionMediaOrder.filter((mediaType) => day.mediaCounts[mediaType] > 0);
};

export const formatContributionDate = (dateKey: string): string => {
  const date = toUtcDate(dateKey);
  if (Number.isNaN(date.getTime())) {
    return dateKey;
  }

  return dayLabelFormatter.format(date);
};

export const formatContributionCountLabel = (count: number): string => {
  return count === 1 ? "1 contribution" : `${count} contributions`;
};

export const buildContributionTooltipLabel = (day: UserContributionDay): string => {
  const dateLabel = formatContributionDate(day.date);
  if (day.totalCount === 0) {
    return `No contributions on ${dateLabel}`;
  }

  const mediaLabel = getContributionMediaTypesForDay(day)
    .map((mediaType) => contributionMediaLabel[mediaType])
    .join(", ");

  return [
    `${formatContributionCountLabel(day.totalCount)} on ${dateLabel}`,
    `${day.logCount} logs · ${day.reviewCount} reviews`,
    `Types: ${mediaLabel}`,
  ].join("\n");
};

export const buildContributionSummaryLabel = (
  calendar: UserContributionCalendar,
): string => {
  return `${formatContributionCountLabel(calendar.totals.contributions)} in the last ${calendar.window.days} days`;
};

export const buildContributionStreaks = (
  days: UserContributionDay[],
): {
  current: number;
  longest: number;
} => {
  if (days.length === 0) {
    return { current: 0, longest: 0 };
  }

  let longest = 0;
  let running = 0;

  for (const day of days) {
    if (day.totalCount > 0) {
      running += 1;
      longest = Math.max(longest, running);
    } else {
      running = 0;
    }
  }

  let current = 0;
  for (let index = days.length - 1; index >= 0; index -= 1) {
    if ((days[index]?.totalCount ?? 0) <= 0) {
      break;
    }

    current += 1;
  }

  return { current, longest };
};
