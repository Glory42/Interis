import { Link } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { AlignLeft, BookOpen, Heart, RefreshCw } from "lucide-react";
import {
  feedChannelMeta,
  inferFeedChannel,
  type FeedChannel,
} from "@/features/feed/components/feed-row.utils";
import { getPosterUrl } from "@/features/films/components/utils";
import { ProfileTabEmptyState } from "@/features/profile/components/ProfileTabEmptyState";
import { useUserLikedFilms, useUserRecentActivity } from "@/features/profile/hooks/useProfile";
import type { UserRecentActivity } from "@/features/profile/api";

type ProfileDiaryPageProps = {
  username: string;
};

type RatingToken = "full" | "half" | "empty";

type DiaryRow = {
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

const channelDisplayLabel: Record<FeedChannel, string> = {
  cinema: "Cinema",
  serial: "Serial",
  codex: "Codex",
  echoes: "Echoes",
};

const toDateParts = (value: string): {
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

const toRatingTokens = (ratingOutOfFive: number | null): RatingToken[] => {
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

const toPosterFallbackLabel = (title: string): string => {
  const trimmed = title.trim();
  if (!trimmed) {
    return "No Art";
  }

  return trimmed.split(/\s+/).slice(0, 2).join(" ");
};

const toDiaryRows = (
  activityItems: UserRecentActivity[],
  likedMovieTmdbIdSet: Set<number>,
): DiaryRow[] => {
  const normalizedRows = activityItems
    .filter((item) => {
      const channel = inferFeedChannel(item);
      if (!channel) {
        return false;
      }

      if (item.kind === "diary_entry" || item.kind === "review") {
        return true;
      }

      if (item.kind === "post" && (channel === "codex" || channel === "echoes")) {
        return true;
      }

      return false;
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
      const hasReview = item.kind === "review" || item.metadata.hasReview === true || !!reviewId;

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
        isLiked: channel === "cinema" && tmdbId !== null && likedMovieTmdbIdSet.has(tmdbId),
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

const DiaryRatingStars = ({
  ratingOutOfFive,
  color,
}: {
  ratingOutOfFive: number | null;
  color: string;
}) => {
  const tokens = toRatingTokens(ratingOutOfFive);
  const ratingLabel =
    ratingOutOfFive === null
      ? "Unrated"
      : Number.isInteger(ratingOutOfFive)
        ? `${ratingOutOfFive.toFixed(0)} stars`
        : `${ratingOutOfFive.toFixed(1)} stars`;

  return (
    <span className="flex items-center gap-0.5" aria-label={ratingLabel}>
      {tokens.map((token, index) => {
        if (token === "full") {
          return (
            <span
              key={`diary-rating-full-${index}`}
              style={{ color, fontSize: 11 }}
            >
              ★
            </span>
          );
        }

        if (token === "half") {
          return (
            <span
              key={`diary-rating-half-${index}`}
              style={{ color, fontSize: 11 }}
            >
              ½
            </span>
          );
        }

        return (
          <span
            key={`diary-rating-empty-${index}`}
            style={{ color: "var(--profile-shell-muted)", fontSize: 11 }}
          >
            ★
          </span>
        );
      })}
    </span>
  );
};

const DiaryPosterCell = ({
  title,
  posterPath,
}: {
  title: string;
  posterPath: string | null;
}) => {
  const [didPosterFail, setDidPosterFail] = useState(false);
  const posterUrl = posterPath ? getPosterUrl(posterPath) : null;
  const shouldShowPoster = Boolean(posterUrl && !didPosterFail);

  return (
    <div
      className="flex h-14 w-10 shrink-0 items-center justify-center overflow-hidden border"
      style={{
        borderColor: "var(--profile-shell-row-border)",
        background: "color-mix(in srgb, var(--profile-shell-bg) 85%, black)",
      }}
    >
      {shouldShowPoster ? (
        <img
          src={posterUrl ?? undefined}
          alt={`${title} poster`}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => {
            setDidPosterFail(true);
          }}
        />
      ) : (
        <span className="px-0.5 text-center font-mono text-[7px] leading-tight profile-shell-muted">
          {toPosterFallbackLabel(title)}
        </span>
      )}
    </div>
  );
};

const DiaryMediaLink = ({
  row,
  className,
  children,
}: {
  row: DiaryRow;
  className?: string;
  children: ReactNode;
}) => {
  if (row.channel === "serial" && row.tmdbId !== null) {
    return (
      <Link
        to="/serials/$tmdbId"
        params={{ tmdbId: String(row.tmdbId) }}
        className={className}
        viewTransition
      >
        {children}
      </Link>
    );
  }

  if (row.channel === "cinema" && row.tmdbId !== null) {
    return (
      <Link
        to="/cinema/$tmdbId"
        params={{ tmdbId: String(row.tmdbId) }}
        className={className}
        viewTransition
      >
        {children}
      </Link>
    );
  }

  if (row.channel === "codex") {
    return (
      <Link to="/codex" className={className} viewTransition>
        {children}
      </Link>
    );
  }

  if (row.channel === "echoes") {
    return (
      <Link to="/echoes" className={className} viewTransition>
        {children}
      </Link>
    );
  }

  return <span className={className}>{children}</span>;
};

export const ProfileDiaryPage = ({ username }: ProfileDiaryPageProps) => {
  const activityQuery = useUserRecentActivity(username, 120);
  const likedQuery = useUserLikedFilms(username);

  const likedTmdbIdSet = useMemo(() => {
    return new Set(
      (likedQuery.data ?? [])
        .filter((item) => item.mediaType === "movie")
        .map((movie) => movie.tmdbId),
    );
  }, [likedQuery.data]);

  const rows = useMemo(() => {
    return toDiaryRows(activityQuery.data ?? [], likedTmdbIdSet);
  }, [activityQuery.data, likedTmdbIdSet]);

  return (
    <>
      {activityQuery.isPending ? (
        <div className=" border border-border/60 bg-card/30 p-4 text-sm text-muted-foreground">
          Loading diary...
        </div>
      ) : null}

      {activityQuery.isError ? (
        <div className=" border border-border/60 bg-card/30 p-4 text-sm text-destructive">
          Could not load diary entries.
        </div>
      ) : null}

      {!activityQuery.isPending && !activityQuery.isError && rows.length === 0 ? (
        <ProfileTabEmptyState
          icon={BookOpen}
          title="No diary activity yet"
          description="This profile has not logged or reviewed anything yet."
        />
      ) : null}

      <div className="space-y-0">
        <div
          className="hidden items-center gap-3 border-b px-2 pb-2 md:grid md:grid-cols-[80px_48px_56px_1fr_80px_120px_32px_32px_32px]"
          style={{ borderColor: "var(--profile-shell-border)" }}
        >
          <p className="font-mono text-[9px] uppercase tracking-widest profile-shell-muted">
            Month
          </p>
          <p className="font-mono text-[9px] uppercase tracking-widest profile-shell-muted">
            Day
          </p>
          <p className="font-mono text-[9px] uppercase tracking-widest profile-shell-muted"></p>
          <p className="font-mono text-[9px] uppercase tracking-widest profile-shell-muted">
            Entry
          </p>
          <p className="font-mono text-[9px] uppercase tracking-widest profile-shell-muted">
            Released
          </p>
          <p className="font-mono text-[9px] uppercase tracking-widest profile-shell-muted">
            Rating
          </p>
          <p className="text-center font-mono text-[9px] uppercase tracking-widest profile-shell-muted">
            Like
          </p>
          <p className="text-center font-mono text-[9px] uppercase tracking-widest profile-shell-muted">
            Rew.
          </p>
          <p className="text-center font-mono text-[9px] uppercase tracking-widest profile-shell-muted">
            Rev.
          </p>
        </div>

        {rows.map((row) => {
          const channelMeta = feedChannelMeta[row.channel];

          return (
            <div
              key={row.id}
              className="group grid grid-cols-[1fr] items-center gap-3 border-b px-2 py-3 transition-colors hover:bg-white/[0.015] md:grid-cols-[80px_48px_56px_1fr_80px_120px_32px_32px_32px]"
              style={{ borderColor: "var(--profile-shell-row-border)" }}
            >
              <div className="hidden md:flex">
                {row.showMonthCell ? (
                  <div
                    className="flex h-14 w-16 flex-col items-center justify-center border"
                    style={{
                      borderColor: "var(--profile-shell-border)",
                      background:
                        "color-mix(in srgb, var(--profile-shell-accent) 12%, var(--profile-shell-bg))",
                    }}
                  >
                    <span className="font-mono text-[9px] font-bold uppercase tracking-widest profile-shell-accent">
                      {row.dateParts.month}
                    </span>
                    <span className="font-mono text-[10px] profile-shell-muted">
                      {row.dateParts.year}
                    </span>
                  </div>
                ) : (
                  <div className="h-14 w-16" />
                )}
              </div>

              <div className="hidden md:block">
                <span className="font-mono text-xl font-bold profile-shell-muted">
                  {row.dateParts.day}
                </span>
              </div>

              <div className="hidden md:block">
                <DiaryMediaLink row={row} className="block">
                  <DiaryPosterCell title={row.title} posterPath={row.posterPath} />
                </DiaryMediaLink>
              </div>

              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-2 md:hidden">
                  <span className="font-mono text-[9px] uppercase tracking-widest profile-shell-accent">
                    {row.dateParts.month} {row.dateParts.day}
                  </span>
                  <span
                    className="border px-1.5 py-0.5 font-mono text-[9px]"
                    style={{
                      color: channelMeta.color,
                      borderColor: `color-mix(in srgb, ${channelMeta.color} 38%, transparent)`,
                    }}
                  >
                    {channelDisplayLabel[row.channel]}
                  </span>
                </div>

                <DiaryMediaLink
                  row={row}
                  className="block truncate font-sans text-sm font-medium"
                >
                  <span style={{ color: "var(--profile-shell-fg)" }}>{row.title}</span>
                </DiaryMediaLink>

                <div className="mt-1 flex items-center gap-3 md:hidden">
                  <DiaryRatingStars
                    ratingOutOfFive={row.ratingOutOfFive}
                    color={channelMeta.color}
                  />
                  <span className="font-mono text-[9px] profile-shell-muted">
                    {row.releaseYear ?? "----"}
                  </span>
                  {row.reviewId ? (
                    <Link
                      to="/reviews/$username/$reviewId"
                      params={{ username, reviewId: row.reviewId }}
                      className="font-mono text-[9px] uppercase tracking-widest"
                      style={{ color: channelMeta.color }}
                      viewTransition
                    >
                      Review
                    </Link>
                  ) : null}
                </div>
              </div>

              <div className="hidden md:block">
                <span className="font-mono text-xs profile-shell-muted">
                  {row.releaseYear ?? "----"}
                </span>
              </div>

              <div className="hidden items-center md:flex">
                <DiaryRatingStars
                  ratingOutOfFive={row.ratingOutOfFive}
                  color={channelMeta.color}
                />
              </div>

              <div className="hidden justify-center md:flex">
                <Heart
                  className="h-3.5 w-3.5 transition-colors"
                  style={{
                    color: row.isLiked
                      ? "var(--profile-shell-accent)"
                      : "var(--profile-shell-muted)",
                    fill: row.isLiked ? "var(--profile-shell-accent)" : "none",
                  }}
                  aria-label={row.isLiked ? "Liked" : "Like"}
                />
              </div>

              <div className="hidden justify-center md:flex">
                {row.rewatch ? (
                  <RefreshCw
                    className="h-3 w-3"
                    style={{ color: channelMeta.color }}
                    aria-label="Rewatch"
                  />
                ) : (
                  <div className="h-3 w-3" />
                )}
              </div>

              <div className="hidden justify-center md:flex">
                {row.hasReview && row.reviewId ? (
                  <Link
                    to="/reviews/$username/$reviewId"
                    params={{ username, reviewId: row.reviewId }}
                    className="inline-flex"
                    viewTransition
                  >
                    <AlignLeft
                      className="h-3 w-3"
                      style={{ color: channelMeta.color }}
                      aria-label="Has review"
                    />
                  </Link>
                ) : (
                  <div className="h-3 w-3" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};
