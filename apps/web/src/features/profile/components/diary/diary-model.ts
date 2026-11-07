import type { FeedChannel } from "@/features/feed/components/feed-row.utils";
import type { DiaryItem } from "@/features/profile/api";
import { parseDateOnly } from "@/lib/time";

export type DiaryRow = {
  id: string;
  channel: FeedChannel;
  title: string;
  posterPath: string | null;
  tmdbId: number | null;
  releaseYear: number | null;
  createdAt: string;
  rating: number | null;
  rewatch: boolean;
  reviewId: string | null;
  hasReview: boolean;
  isLiked: boolean;
  dateParts: {
    month: string;
    day: string;
    year: string;
    monthKey: string;
  };
  showMonthCell: boolean;
  // Big day number and weekday, on the first row of each day only.
  dayLabel: { day: string; weekday: string } | null;
};

export type DiaryMonth = {
  key: string;
  label: string;
  // null while older pages of this month may still be unloaded.
  count: number | null;
  rows: DiaryRow[];
};

export const channelDisplayLabel: Record<FeedChannel, string> = {
  movie: "Movie",
  serial: "Serial",
};

export const toDateParts = (value: string): {
  month: string;
  day: string;
  year: string;
  monthKey: string;
} => {
  const date = parseDateOnly(value);

  if (Number.isNaN(date.getTime())) {
    return {
      month: "UNK",
      day: "--",
      year: "----",
      monthKey: "unknown",
    };
  }

  const month = new Intl.DateTimeFormat("en-US", { month: "short" })
    .format(date)
    .toUpperCase();
  const day = String(date.getDate()).padStart(2, "0");
  const year = String(date.getFullYear());
  const monthKey = `${year}-${String(date.getMonth() + 1).padStart(2, "0")}`;

  return { month, day, year, monthKey };
};

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const channelByMediaType: Record<DiaryItem["mediaType"], FeedChannel> = {
  movie: "movie",
  tv: "serial",
};

export const toPosterFallbackLabel = (title: string): string => {
  const trimmed = title.trim();
  if (!trimmed) {
    return "No Art";
  }

  return trimmed.split(/\s+/).slice(0, 2).join(" ");
};

export const toDiaryRows = (diaryItems: DiaryItem[]): DiaryRow[] => {
  // diaryItems arrives pre-sorted by watchedDate desc, createdAt desc from
  // PublicService.getDiary (the source of getUserDiary), and pages are
  // fetched/flattened in that same offset order, so no re-sort is needed
  // here - grouping just relies on the order the API already guarantees.
  const normalizedRows = diaryItems.map((item) => {
    const channel = channelByMediaType[item.mediaType];
    const tmdbId = item.media.tmdbId;

    return {
      id: item.id,
      channel,
      title: item.media.title,
      posterPath: item.media.posterPath,
      tmdbId,
      releaseYear: item.media.releaseYear,
      createdAt: item.watchedDate,
      rating: item.rating,
      rewatch: item.rewatch,
      reviewId: item.review?.id ?? null,
      hasReview: item.review !== null,
      isLiked: item.liked,
    };
  });

  return normalizedRows.map((row, index) => {
    const dateParts = toDateParts(row.createdAt);
    const previous = index > 0 ? normalizedRows[index - 1]?.createdAt : undefined;
    const previousMonthKey = previous ? toDateParts(previous).monthKey : null;
    const weekday = parseDateOnly(row.createdAt);

    return {
      ...row,
      dateParts,
      showMonthCell: dateParts.monthKey !== previousMonthKey,
      dayLabel:
        previous === row.createdAt || Number.isNaN(weekday.getTime())
          ? null
          : { day: dateParts.day, weekday: WEEKDAYS[weekday.getDay()]! },
    };
  });
};

const MONTH_NAMES = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];

// Month sections with a slate label and count; hasMore means the last month may be cut off.
export const toDiaryMonths = (rows: DiaryRow[], hasMore: boolean): DiaryMonth[] => {
  const months: DiaryMonth[] = [];
  for (const row of rows) {
    const key = row.dateParts.monthKey;
    if (months.at(-1)?.key !== key) {
      const [year, month] = key.split("-");
      const label = month ? `${MONTH_NAMES[Number(month) - 1]} ${year}` : "UNDATED";
      months.push({ key, label, count: 0, rows: [] });
    }
    const current = months.at(-1)!;
    current.rows.push(row);
    current.count = (current.count ?? 0) + 1;
  }
  if (hasMore && months.length > 0) months.at(-1)!.count = null;
  return months;
};
