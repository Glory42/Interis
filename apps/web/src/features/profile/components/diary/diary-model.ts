import type { FeedChannel } from "@/features/feed/components/feed-row.utils";
import type { DiaryItem } from "@/features/profile/api";
import { parseDateOnly } from "@/lib/time";

export type RatingToken = "full" | "half" | "empty";

export type DiaryRow = {
  id: string;
  channel: FeedChannel;
  mediaType: DiaryItem["mediaType"];
  title: string;
  posterPath: string | null;
  coverArtUrl: string | null;
  tmdbId: number | null;
  mbid: string | null;
  volumeId: string | null;
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
};

export const channelDisplayLabel: Record<FeedChannel, string> = {
  cinema: "Cinema",
  serial: "Serial",
  music: "Music",
  books: "Books",
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

const channelByMediaType: Record<DiaryItem["mediaType"], FeedChannel> = {
  movie: "cinema",
  tv: "serial",
  album: "music",
  book: "books",
  // Tracks belong to the music module for feed/channel routing, the same
  // way Season/Episode reuse "serial" rather than a channel of their own.
  track: "music",
};

export const toRatingTokens = (rating: number | null): RatingToken[] => {
  if (rating === null || Number.isNaN(rating)) {
    return Array.from({ length: 10 }, () => "empty" as RatingToken);
  }

  const normalized = Math.max(0, Math.min(10, rating));

  return Array.from({ length: 10 }, (_, index) => {
    const delta = normalized - index;
    if (delta >= 1) return "full";
    if (delta >= 0.5) return "half";
    return "empty";
  });
};

export const toPosterFallbackLabel = (title: string): string => {
  const trimmed = title.trim();
  if (!trimmed) {
    return "No Art";
  }

  return trimmed.split(/\s+/).slice(0, 2).join(" ");
};

export const toDiaryRows = (
  diaryItems: DiaryItem[],
  likedMovieTmdbIdSet: Set<number>,
): DiaryRow[] => {
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
      mediaType: item.mediaType,
      title: item.media.title,
      posterPath: item.media.posterPath ?? null,
      coverArtUrl: item.media.coverArtUrl ?? null,
      tmdbId,
      mbid: item.media.mbid ?? null,
      volumeId: item.media.volumeId ?? null,
      releaseYear: item.media.releaseYear,
      createdAt: item.watchedDate,
      rating: item.rating,
      rewatch: item.rewatch,
      reviewId: item.review?.id ?? null,
      hasReview: item.review !== null,
      isLiked:
        channel === "cinema" && tmdbId !== null && likedMovieTmdbIdSet.has(tmdbId),
    };
  });

  return normalizedRows.map((row, index) => {
    const dateParts = toDateParts(row.createdAt);
    const previousMonthKey =
      index > 0 ? toDateParts(normalizedRows[index - 1]?.createdAt ?? "").monthKey : null;

    return {
      ...row,
      dateParts,
      showMonthCell: dateParts.monthKey !== previousMonthKey,
    };
  });
};
