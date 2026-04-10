import type { FeedChannel } from "@/features/feed/components/feed-row.utils";
import { inferFeedChannel } from "@/features/feed/components/feed-row.utils";
import type { UserRecentActivity } from "@/features/profile/api";

export type RatingToken = "full" | "half" | "empty";

export type DiaryRow = {
  id: string;
  channel: FeedChannel;
  title: string;
  posterPath: string | null;
  tmdbId: number | null;
  releaseYear: number | null;
  createdAt: string;
  ratingOutOfFive: number | null;
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
};

export const toDateParts = (value: string): {
  month: string;
  day: string;
  year: string;
  monthKey: string;
} => {
  const date = new Date(value);

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

const toTimestamp = (value: string): number => {
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const toRatingOutOfFive = (ratingOutOfTen: number | null): number | null => {
  if (ratingOutOfTen === null) {
    return null;
  }

  return Math.max(0, Math.min(5, ratingOutOfTen / 2));
};

const toReviewId = (item: UserRecentActivity): string | null => {
  if (item.review?.id) {
    return item.review.id;
  }

  if (item.metadata.reviewId) {
    return item.metadata.reviewId;
  }

  return null;
};

export const toRatingTokens = (ratingOutOfFive: number | null): RatingToken[] => {
  if (ratingOutOfFive === null || Number.isNaN(ratingOutOfFive)) {
    return ["empty", "empty", "empty", "empty", "empty"];
  }

  return Array.from({ length: 5 }, (_, index) => {
    const delta = ratingOutOfFive - index;
    if (delta >= 1) {
      return "full";
    }

    if (delta >= 0.5) {
      return "half";
    }

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
  activityItems: UserRecentActivity[],
  likedMovieTmdbIdSet: Set<number>,
): DiaryRow[] => {
  const normalizedRows = activityItems
    .filter((item) => {
      const channel = inferFeedChannel(item);
      if (!channel) {
        return false;
      }

      return item.kind === "diary_entry" || item.kind === "review";
    })
    .map((item) => {
      const channel = inferFeedChannel(item);
      if (!channel) {
        return null;
      }

      const title = item.movie?.title ?? item.post?.content ?? "Untitled entry";
      const tmdbId = item.movie?.tmdbId ?? null;
      const ratingOutOfFive =
        item.kind === "diary_entry"
          ? toRatingOutOfFive(item.metadata.rating)
          : toRatingOutOfFive(item.review?.rating ?? item.metadata.rating);
      const reviewId = toReviewId(item);
      const hasReview =
        item.kind === "review" || item.metadata.hasReview === true || !!reviewId;

      return {
        id: item.id,
        channel,
        title,
        posterPath: item.movie?.posterPath ?? null,
        tmdbId,
        releaseYear: item.movie?.releaseYear ?? null,
        createdAt: item.createdAt,
        ratingOutOfFive,
        rewatch: item.metadata.rewatch === true,
        reviewId,
        hasReview,
        isLiked:
          channel === "cinema" && tmdbId !== null && likedMovieTmdbIdSet.has(tmdbId),
      };
    })
    .filter((row): row is Omit<DiaryRow, "dateParts" | "showMonthCell"> => row !== null)
    .sort((left, right) => toTimestamp(right.createdAt) - toTimestamp(left.createdAt));

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
