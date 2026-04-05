import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Award,
  Check,
  Clock3,
  DollarSign,
  Globe2,
  Heart,
  Languages,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { LogFilmModal } from "@/features/diary/components/LogFilmModal";
import { type MovieDetailReviewSort } from "@/features/films/api";
import {
  SpaceRatingDisplay,
  SpaceRatingInput,
} from "@/features/films/components/SpaceRating";
import { formatRatingOutOfFiveLabel } from "@/features/films/components/spaceRating.utils";
import { formatRuntimeLabel, getPosterUrl } from "@/features/films/components/utils";
import { useMovieDetailView } from "@/features/films/hooks/useMovies";
import {
  useMovieInteraction,
  useUpdateMovieInteraction,
} from "@/features/interactions/hooks/useInteractions";

type CinemaDetailPageProps = {
  tmdbId: number;
};

const CINEMA_MODULE_STYLES = {
  accent: "var(--module-cinema)",
  text: "var(--foreground)",
  muted: "color-mix(in srgb, var(--foreground) 68%, transparent)",
  faint: "color-mix(in srgb, var(--foreground) 36%, transparent)",
  border: "color-mix(in srgb, var(--module-cinema) 26%, transparent)",
  borderSoft: "color-mix(in srgb, var(--module-cinema) 16%, transparent)",
  panel: "color-mix(in srgb, var(--card) 92%, var(--background) 8%)",
  panelElevated: "color-mix(in srgb, var(--card) 84%, var(--background) 16%)",
  panelSoft: "color-mix(in srgb, var(--module-cinema) 10%, transparent)",
  panelStrong: "color-mix(in srgb, var(--module-cinema) 26%, transparent)",
  badge: "color-mix(in srgb, var(--module-cinema) 14%, transparent)",
} as const;

const formatRelativeTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const deltaSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const absSeconds = Math.abs(deltaSeconds);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (absSeconds < 60) {
    return formatter.format(deltaSeconds, "second");
  }

  const deltaMinutes = Math.round(deltaSeconds / 60);
  if (Math.abs(deltaMinutes) < 60) {
    return formatter.format(deltaMinutes, "minute");
  }

  const deltaHours = Math.round(deltaMinutes / 60);
  if (Math.abs(deltaHours) < 24) {
    return formatter.format(deltaHours, "hour");
  }

  const deltaDays = Math.round(deltaHours / 24);
  return formatter.format(deltaDays, "day");
};

const toLanguageLabel = (languageCode: string | null): string | null => {
  if (!languageCode) {
    return null;
  }

  try {
    const displayNames = new Intl.DisplayNames(["en"], { type: "language" });
    return displayNames.of(languageCode) ?? languageCode.toUpperCase();
  } catch {
    return languageCode.toUpperCase();
  }
};

const formatMoneyLabel = (value: number | null): string => {
  if (value === null || !Number.isFinite(value) || value <= 0) {
    return "Unknown";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
};

export function CinemaDetailPage({ tmdbId }: CinemaDetailPageProps) {
  const isValidTmdbId = Number.isInteger(tmdbId) && tmdbId > 0;
  const [reviewsSort, setReviewsSort] = useState<MovieDetailReviewSort>("popular");
  const [draftRatingOutOfFive, setDraftRatingOutOfFive] = useState<number | null>(null);

  const detailQuery = useMovieDetailView(tmdbId, reviewsSort, isValidTmdbId);

  const { user } = useAuth();
  const interactionQuery = useMovieInteraction(tmdbId, Boolean(user) && isValidTmdbId);
  const updateInteractionMutation = useUpdateMovieInteraction(tmdbId);

  if (!isValidTmdbId) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <div
          className="border p-5 font-mono text-xs"
          style={{
            borderColor: CINEMA_MODULE_STYLES.border,
            background: CINEMA_MODULE_STYLES.panel,
            color: CINEMA_MODULE_STYLES.muted,
          }}
        >
          Invalid movie id.
        </div>
      </main>
    );
  }

  if (detailQuery.isPending) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <div
          className="h-64 animate-pulse border"
          style={{
            borderColor: CINEMA_MODULE_STYLES.border,
            background: CINEMA_MODULE_STYLES.panel,
          }}
        />
      </main>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <div
          className="border p-5 font-mono text-xs"
          style={{
            borderColor: CINEMA_MODULE_STYLES.border,
            background: CINEMA_MODULE_STYLES.panel,
            color: CINEMA_MODULE_STYLES.muted,
          }}
        >
          Could not load this movie right now.
        </div>
      </main>
    );
  }

  const detail = detailQuery.data;
  const movie = detail.movie;

  const runtimeLabel = formatRuntimeLabel(movie.runtime);
  const languageLabel = toLanguageLabel(movie.languageCode);
  const communityRatingLabel =
    detail.ratingBreakdown.averageRatingOutOfFive !== null
      ? detail.ratingBreakdown.averageRatingOutOfFive.toFixed(1)
      : "--";
  const tmdbRatingLabel =
    movie.globalRatingOutOfTen !== null ? movie.globalRatingOutOfTen.toFixed(1) : "--";

  const watchlisted = interactionQuery.data?.watchlisted ?? false;
  const isInteractionBusy = interactionQuery.isPending || updateInteractionMutation.isPending;

  const modalInitialState = {
    watchedDate: detail.userRating?.watchedDate ?? null,
    ratingOutOfFive:
      draftRatingOutOfFive ??
      (detail.userRating?.ratingOutOfFive !== null &&
      detail.userRating?.ratingOutOfFive !== undefined
        ? detail.userRating.ratingOutOfFive
        : null),
    rewatch: detail.userRating?.rewatch ?? false,
    reviewContent: detail.userRating?.reviewContent ?? null,
    containsSpoilers: detail.userRating?.reviewContainsSpoilers ?? null,
  };

  const factRows = [
    {
      label: "Director",
      value: movie.director ?? "Unknown",
      icon: Award,
    },
    {
      label: "Runtime",
      value: runtimeLabel ?? "Unknown",
      icon: Clock3,
    },
    {
      label: "Language",
      value: languageLabel ?? "Unknown",
      icon: Languages,
    },
    {
      label: "Country",
      value: movie.productionCountries[0] ?? "Unknown",
      icon: Globe2,
    },
    {
      label: "Budget",
      value: formatMoneyLabel(movie.budget),
      icon: DollarSign,
    },
    {
      label: "Box Office",
      value: formatMoneyLabel(movie.revenue),
      icon: DollarSign,
    },
  ] as const;

  return (
    <div className="min-h-screen">
      <div
        className="sticky top-12 z-20 flex items-center gap-3 border-b px-4 py-3"
        style={{
          background: "color-mix(in srgb, var(--card) 94%, var(--background) 6%)",
          borderColor: CINEMA_MODULE_STYLES.border,
          backdropFilter: "blur(12px)",
        }}
      >
        <Link
          to="/cinema"
          className="flex items-center gap-1.5 font-mono text-[11px]"
          style={{ color: CINEMA_MODULE_STYLES.muted }}
          viewTransition
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Cinema</span>
        </Link>

        <span className="font-mono text-[11px]" style={{ color: CINEMA_MODULE_STYLES.faint }}>
          /
        </span>

        <span
          className="truncate font-mono text-[11px] uppercase"
          style={{ color: CINEMA_MODULE_STYLES.accent }}
        >
          {movie.title}
        </span>
      </div>

      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[220px_1fr]">
          <aside>
            <div
              className="mb-4 aspect-[2/3] overflow-hidden border"
              style={{ borderColor: CINEMA_MODULE_STYLES.border }}
            >
              {movie.posterPath ? (
                <img
                  src={getPosterUrl(movie.posterPath)}
                  alt={`${movie.title} poster`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div
                  className="flex h-full w-full flex-col items-center justify-center gap-2"
                  style={{ background: CINEMA_MODULE_STYLES.panelSoft }}
                >
                  <div
                    className="flex h-8 w-8 items-center justify-center"
                    style={{ background: CINEMA_MODULE_STYLES.panelStrong }}
                  >
                    <Award className="h-4 w-4" style={{ color: CINEMA_MODULE_STYLES.accent }} />
                  </div>
                  <span
                    className="font-mono text-[8px] uppercase tracking-[0.22em]"
                    style={{ color: CINEMA_MODULE_STYLES.faint }}
                  >
                    No Art
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <LogFilmModal
                  tmdbId={movie.tmdbId}
                  movieTitle={movie.title}
                  movieReleaseYear={movie.releaseYear}
                  moviePosterPath={movie.posterPath}
                  initialState={modalInitialState}
                  triggerVariant="outline"
                  triggerLabel="Log"
                  triggerClassName="h-auto flex-1 border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em]"
                  triggerContent={
                    <>
                      <Check className="h-3 w-3" />
                      <span>Log</span>
                    </>
                  }
                />

                {user ? (
                  <button
                    type="button"
                    disabled={isInteractionBusy}
                    className="flex flex-1 items-center justify-center gap-1.5 border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] transition-all disabled:cursor-not-allowed disabled:opacity-60"
                    style={{
                      borderColor: watchlisted
                        ? CINEMA_MODULE_STYLES.accent
                        : CINEMA_MODULE_STYLES.border,
                      color: watchlisted
                        ? CINEMA_MODULE_STYLES.accent
                        : CINEMA_MODULE_STYLES.muted,
                      background: "transparent",
                    }}
                    onClick={() => {
                      void updateInteractionMutation.mutateAsync({
                        watchlisted: !watchlisted,
                      });
                    }}
                  >
                    <Plus className="h-3 w-3" />
                    <span>{watchlisted ? "Queued" : "Queue"}</span>
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="flex flex-1 items-center justify-center gap-1.5 border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em]"
                    style={{
                      borderColor: CINEMA_MODULE_STYLES.border,
                      color: CINEMA_MODULE_STYLES.muted,
                    }}
                    viewTransition
                  >
                    <Plus className="h-3 w-3" />
                    <span>Queue</span>
                  </Link>
                )}
              </div>

              <div
                className="border p-3"
                style={{
                  borderColor: CINEMA_MODULE_STYLES.border,
                  background: CINEMA_MODULE_STYLES.panelElevated,
                }}
              >
                <p
                  className="mb-2 font-mono text-[9px] uppercase tracking-[0.22em]"
                  style={{ color: CINEMA_MODULE_STYLES.faint }}
                >
                  Your Rating
                </p>
                <div className="flex items-center gap-3">
                  <SpaceRatingInput
                    value={
                      draftRatingOutOfFive ??
                      (detail.userRating?.ratingOutOfFive !== null &&
                      detail.userRating?.ratingOutOfFive !== undefined
                        ? detail.userRating.ratingOutOfFive
                        : null)
                    }
                    onChange={setDraftRatingOutOfFive}
                  />
                </div>
                <p className="mt-2 font-mono text-[10px]" style={{ color: CINEMA_MODULE_STYLES.muted }}>
                  {formatRatingOutOfFiveLabel(draftRatingOutOfFive) ??
                    formatRatingOutOfFiveLabel(detail.userRating?.ratingOutOfFive ?? null) ??
                    "No rating yet"}
                </p>
              </div>
            </div>
          </aside>

          <section>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px]" style={{ color: CINEMA_MODULE_STYLES.faint }}>
                {movie.releaseYear ?? "Unknown"}
              </span>
              {movie.genres.slice(0, 3).map((genre) => (
                <span
                  key={`detail-genre-${genre.id}`}
                  className="border px-2 py-0.5 font-mono text-[9px]"
                  style={{
                    borderColor: CINEMA_MODULE_STYLES.border,
                    color: CINEMA_MODULE_STYLES.muted,
                  }}
                >
                  {genre.name}
                </span>
              ))}
            </div>

            <h1
              className="mb-2 font-mono text-3xl font-bold leading-tight md:text-5xl"
              style={{ color: CINEMA_MODULE_STYLES.text }}
            >
              {movie.title}
            </h1>
            <p className="mb-6 font-mono text-sm" style={{ color: CINEMA_MODULE_STYLES.muted }}>
              <span>dir. </span>
              <span style={{ color: CINEMA_MODULE_STYLES.accent }}>
                {movie.director ?? "Unknown"}
              </span>
            </p>

            <div
              className="mb-8 flex flex-wrap items-center gap-8 border-b pb-8"
              style={{ borderColor: CINEMA_MODULE_STYLES.borderSoft }}
            >
              <div>
                <p
                  className="mb-1 font-mono text-[9px] uppercase tracking-[0.22em]"
                  style={{ color: CINEMA_MODULE_STYLES.faint }}
                >
                  Community
                </p>
                <div className="flex items-baseline gap-2">
                  <span
                    className="font-mono text-2xl font-bold"
                    style={{ color: CINEMA_MODULE_STYLES.accent }}
                  >
                    {communityRatingLabel}
                  </span>
                  <span className="font-mono text-[10px]" style={{ color: CINEMA_MODULE_STYLES.faint }}>
                    {detail.logsCount.toLocaleString()} logs
                  </span>
                </div>
              </div>

              <div>
                <p
                  className="mb-1 font-mono text-[9px] uppercase tracking-[0.22em]"
                  style={{ color: CINEMA_MODULE_STYLES.faint }}
                >
                  TMDB
                </p>
                <span
                  className="font-mono text-2xl font-bold"
                  style={{ color: CINEMA_MODULE_STYLES.muted }}
                >
                  {tmdbRatingLabel}
                </span>
              </div>
            </div>

            <p
              className="mb-8 text-sm leading-relaxed"
              style={{
                color: CINEMA_MODULE_STYLES.muted,
                fontFamily: "Georgia, serif",
              }}
            >
              {movie.overview || "No synopsis is available for this title."}
            </p>

            <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
              {factRows.map((fact) => (
                <div
                  key={fact.label}
                  className="flex items-start gap-3 border-b py-3"
                  style={{ borderColor: CINEMA_MODULE_STYLES.borderSoft }}
                >
                  <fact.icon
                    className="mt-0.5 h-3.5 w-3.5 shrink-0"
                    style={{ color: CINEMA_MODULE_STYLES.accent }}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className="mb-0.5 font-mono text-[9px] uppercase tracking-[0.22em]"
                      style={{ color: CINEMA_MODULE_STYLES.faint }}
                    >
                      {fact.label}
                    </p>
                    <p className="font-mono text-xs" style={{ color: CINEMA_MODULE_STYLES.text }}>
                      {fact.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-10">
          <div
            className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b pb-4"
            style={{ borderColor: CINEMA_MODULE_STYLES.borderSoft }}
          >
            <h2
              className="font-mono text-lg font-bold"
              style={{ color: CINEMA_MODULE_STYLES.text }}
            >
              Reviews
            </h2>

            <div className="flex gap-2">
              <button
                type="button"
                className="border px-3 py-1.5 font-mono text-[10px] transition-all"
                style={{
                  borderColor:
                    reviewsSort === "popular"
                      ? CINEMA_MODULE_STYLES.accent
                      : CINEMA_MODULE_STYLES.borderSoft,
                  color:
                    reviewsSort === "popular"
                      ? CINEMA_MODULE_STYLES.accent
                      : CINEMA_MODULE_STYLES.faint,
                  background:
                    reviewsSort === "popular"
                      ? "color-mix(in srgb, var(--module-cinema) 8%, transparent)"
                      : "transparent",
                }}
                onClick={() => setReviewsSort("popular")}
              >
                Popular
              </button>

              <button
                type="button"
                className="border px-3 py-1.5 font-mono text-[10px] transition-all"
                style={{
                  borderColor:
                    reviewsSort === "recent"
                      ? CINEMA_MODULE_STYLES.accent
                      : CINEMA_MODULE_STYLES.borderSoft,
                  color:
                    reviewsSort === "recent"
                      ? CINEMA_MODULE_STYLES.accent
                      : CINEMA_MODULE_STYLES.faint,
                  background:
                    reviewsSort === "recent"
                      ? "color-mix(in srgb, var(--module-cinema) 8%, transparent)"
                      : "transparent",
                }}
                onClick={() => setReviewsSort("recent")}
              >
                Recent
              </button>
            </div>
          </div>

          {detail.reviews.length === 0 ? (
            <div
              className="border p-4 font-mono text-xs"
              style={{
                borderColor: CINEMA_MODULE_STYLES.border,
                color: CINEMA_MODULE_STYLES.muted,
                background: CINEMA_MODULE_STYLES.panel,
              }}
            >
              No reviews yet for this movie.
            </div>
          ) : (
            <div className="space-y-4">
              {detail.reviews.map((review) => {
                const authorName = review.author.displayUsername ?? review.author.username;
                const avatarUrl = review.author.avatarUrl ?? review.author.image;

                return (
                  <article
                    key={review.id}
                    className="border p-4"
                    style={{
                      borderColor: CINEMA_MODULE_STYLES.border,
                      background: CINEMA_MODULE_STYLES.panel,
                    }}
                  >
                    <div className="mb-3 flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={`${review.author.username} avatar`}
                            className="h-9 w-9 border object-cover"
                            style={{ borderColor: CINEMA_MODULE_STYLES.border }}
                          />
                        ) : (
                          <span
                            className="inline-flex h-9 w-9 items-center justify-center border font-mono text-xs"
                            style={{
                              borderColor: CINEMA_MODULE_STYLES.border,
                              color: CINEMA_MODULE_STYLES.text,
                              background: CINEMA_MODULE_STYLES.panelElevated,
                            }}
                          >
                            {review.author.username.slice(0, 1).toUpperCase()}
                          </span>
                        )}

                        <div>
                          <Link
                            to="/profile/$username"
                            params={{ username: review.author.username }}
                            className="font-mono text-xs font-bold"
                            style={{ color: CINEMA_MODULE_STYLES.text }}
                            viewTransition
                          >
                            {authorName}
                          </Link>

                          <div className="mt-0.5 flex items-center gap-2">
                            <SpaceRatingDisplay
                              ratingOutOfFive={review.ratingOutOfFive}
                              size="sm"
                            />
                            <span
                              className="font-mono text-[10px]"
                              style={{ color: CINEMA_MODULE_STYLES.faint }}
                            >
                              {formatRatingOutOfFiveLabel(review.ratingOutOfFive) ?? "Unrated"}
                            </span>
                            <span
                              className="font-mono text-[10px]"
                              style={{ color: CINEMA_MODULE_STYLES.faint }}
                            >
                              {formatRelativeTime(review.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <span
                        className="inline-flex items-center gap-1 font-mono text-[10px]"
                        style={{
                          color: review.viewerHasLiked
                            ? CINEMA_MODULE_STYLES.accent
                            : CINEMA_MODULE_STYLES.faint,
                        }}
                      >
                        <Heart className="h-3 w-3" />
                        {review.likeCount}
                      </span>
                    </div>

                    {review.containsSpoilers ? (
                      <p
                        className="mb-2 inline-flex border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em]"
                        style={{
                          borderColor: CINEMA_MODULE_STYLES.accent,
                          color: CINEMA_MODULE_STYLES.accent,
                          background: CINEMA_MODULE_STYLES.badge,
                        }}
                      >
                        Spoilers
                      </p>
                    ) : null}

                    <p className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: CINEMA_MODULE_STYLES.muted }}>
                      {review.content}
                    </p>

                    <div className="mt-3 border-t pt-3" style={{ borderColor: CINEMA_MODULE_STYLES.borderSoft }}>
                      <Link
                        to="/reviews/$username/$reviewId"
                        params={{
                          username: review.author.username,
                          reviewId: review.id,
                        }}
                        className="font-mono text-[10px] uppercase tracking-[0.16em]"
                        style={{ color: CINEMA_MODULE_STYLES.faint }}
                        viewTransition
                      >
                        Open full review thread
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
