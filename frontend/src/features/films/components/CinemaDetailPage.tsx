import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookText,
  CalendarDays,
  Clock3,
  Film,
  Heart,
  Languages,
  Rocket,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { LogFilmModal } from "@/features/diary/components/LogFilmModal";
import { type MovieDetailReviewSort } from "@/features/films/api";
import {
  SpaceRatingDisplay,
  SpaceRatingInput,
} from "@/features/films/components/SpaceRating";
import { formatRatingOutOfFiveLabel } from "@/features/films/components/spaceRating.utils";
import {
  formatRuntimeLabel,
  getBackdropUrl,
  getPosterUrl,
} from "@/features/films/components/utils";
import { useMovieDetailView } from "@/features/films/hooks/useMovies";
import {
  useMovieInteraction,
  useUpdateMovieInteraction,
} from "@/features/interactions/hooks/useInteractions";
import { cn } from "@/lib/utils";

type CinemaDetailPageProps = {
  tmdbId: number;
};

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

export function CinemaDetailPage({ tmdbId }: CinemaDetailPageProps) {
  const isValidTmdbId = Number.isInteger(tmdbId) && tmdbId > 0;
  const [reviewsSort, setReviewsSort] =
    useState<MovieDetailReviewSort>("popular");
  const [draftRatingOutOfFive, setDraftRatingOutOfFive] = useState<
    number | null
  >(null);
  const detailQuery = useMovieDetailView(tmdbId, reviewsSort, isValidTmdbId);

  const { user } = useAuth();
  const interactionQuery = useMovieInteraction(
    tmdbId,
    Boolean(user) && isValidTmdbId,
  );
  const updateInteractionMutation = useUpdateMovieInteraction(tmdbId);

  if (!isValidTmdbId) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className="rounded-2xl border border-border/70 bg-card/60 p-5 text-sm text-muted-foreground">
          Invalid movie id.
        </div>
      </div>
    );
  }

  if (detailQuery.isPending) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-12">
        <div className="h-64 animate-pulse rounded-2xl border border-border/60 bg-card/35" />
      </div>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className="rounded-2xl border border-destructive/45 bg-destructive/10 p-5 text-sm text-destructive">
          Could not load this movie right now.
        </div>
      </div>
    );
  }

  const detail = detailQuery.data;
  const movie = detail.movie;

  const heroImageUrl = movie.backdropPath
    ? getBackdropUrl(movie.backdropPath)
    : getPosterUrl(movie.posterPath);

  const runtimeLabel = formatRuntimeLabel(movie.runtime);
  const languageLabel = toLanguageLabel(movie.languageCode);
  const globalRatingLabel = formatRatingOutOfFiveLabel(
    movie.globalRatingOutOfFive,
  );

  const watchlisted = interactionQuery.data?.watchlisted ?? false;
  const liked = interactionQuery.data?.liked ?? false;
  const isInteractionBusy =
    interactionQuery.isPending || updateInteractionMutation.isPending;

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

  return (
    <div className="min-h-screen">
      <section className="theme-hero-shell relative h-96 overflow-hidden">
        <img
          src={heroImageUrl}
          alt={`${movie.title} backdrop`}
          className="theme-hero-media h-full w-full object-cover opacity-25"
        />
        <div className="theme-hero-gradient-layer absolute inset-0" />
        <div className="theme-hero-pattern-layer absolute inset-0" />
        <div className="theme-hero-readable-overlay absolute inset-y-0 left-0 w-[74%] bg-linear-to-r from-background/78 via-background/34 to-transparent" />
        <div className="theme-hero-readable-overlay absolute inset-x-0 bottom-0 h-[54%] bg-linear-to-t from-background/74 via-background/26 to-transparent" />

        <div className="absolute left-0 right-0 top-6 z-[22] mx-auto w-full max-w-7xl px-4">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-xl bg-background/45 backdrop-blur-sm"
          >
            <Link to="/cinema" viewTransition>
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
          </Button>
        </div>

        <div className="theme-hero-safe-area mx-auto w-full max-w-7xl px-4">
          <div className="theme-hero-safe-content flex w-full items-end gap-6">
            <div className="-mb-4 hidden shrink-0 sm:block">
              <div className="h-40 w-28 overflow-hidden rounded-xl border border-border/60 shadow-2xl">
                <img
                  src={getPosterUrl(movie.posterPath)}
                  alt={`${movie.title} poster`}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            <div className="flex-1 pb-1">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px]">
                <Film className="h-3 w-3 text-primary" />
                <span className="theme-kicker font-bold uppercase tracking-[0.16em] text-primary">
                  Cinema
                </span>
                {movie.releaseYear ? (
                  <>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">
                      {movie.releaseYear}
                    </span>
                  </>
                ) : null}
                {movie.genres.length > 0 ? (
                  <span className="rounded-full bg-secondary/75 px-2 py-0.5 text-muted-foreground">
                    {movie.genres
                      .slice(0, 2)
                      .map((genre) => genre.name)
                      .join(" / ")}
                  </span>
                ) : null}
              </div>

              <h1 className="theme-display-title text-4xl font-black leading-none tracking-tight text-foreground">
                {movie.title}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {movie.director ?? "Director unknown"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 px-4 pb-16 pt-14 sm:pt-16 lg:grid-cols-12">
        <div className="space-y-10 lg:col-span-8">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <SpaceRatingDisplay
                ratingOutOfFive={movie.globalRatingOutOfFive}
                size="md"
                className="gap-0.5"
              />
              <span className="text-lg font-bold text-foreground">
                {globalRatingLabel ?? "N/A"}
              </span>
            </div>

            <div className="h-4 w-px bg-border/70" />

            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <BookText className="h-3.5 w-3.5" />
              <span>{detail.logsCount.toLocaleString()} logs</span>
            </div>

            {runtimeLabel ? (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock3 className="h-3.5 w-3.5" />
                <span>{runtimeLabel}</span>
              </div>
            ) : null}

            {languageLabel ? (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Languages className="h-3.5 w-3.5" />
                <span>{languageLabel}</span>
              </div>
            ) : null}
          </div>

          <section>
            <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Synopsis
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-foreground/90">
              {movie.overview || "No synopsis available for this title."}
            </p>
          </section>

          <section className="rounded-2xl border border-border/60 bg-card/35 p-5">
            <h2 className="mb-4 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Your Rating
            </h2>

            <div className="mb-4 flex flex-wrap items-center gap-4">
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

              <div className="rounded-lg border border-border/70 bg-secondary/35 px-3 py-1.5 text-sm font-semibold text-foreground">
                {formatRatingOutOfFiveLabel(draftRatingOutOfFive) ??
                  formatRatingOutOfFiveLabel(
                    detail.userRating?.ratingOutOfFive ?? null,
                  ) ??
                  "No rating yet"}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <LogFilmModal
                tmdbId={movie.tmdbId}
                movieTitle={movie.title}
                movieReleaseYear={movie.releaseYear}
                moviePosterPath={movie.posterPath}
                initialState={modalInitialState}
              />

              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                disabled={!user || isInteractionBusy}
                onClick={() => {
                  void updateInteractionMutation.mutateAsync({
                    watchlisted: !watchlisted,
                  });
                }}
              >
                {watchlisted ? "In Watchlist" : "Add to Watchlist"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                disabled={!user || isInteractionBusy}
                onClick={() => {
                  void updateInteractionMutation.mutateAsync({ liked: !liked });
                }}
              >
                {liked ? "Liked" : "Like"}
              </Button>
            </div>
          </section>

          <section>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">Reviews</h2>

              <div className="theme-segment-shell flex rounded-xl border border-border/70 bg-card/50 p-1">
                <button
                  type="button"
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                    reviewsSort === "popular"
                      ? "theme-segment-active"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  onClick={() => setReviewsSort("popular")}
                >
                  Popular
                </button>
                <button
                  type="button"
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                    reviewsSort === "recent"
                      ? "theme-segment-active"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  onClick={() => setReviewsSort("recent")}
                >
                  Recent
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {detail.reviews.length === 0 ? (
                <div className="rounded-2xl border border-border/60 bg-card/30 p-4 text-sm text-muted-foreground">
                  No reviews yet for this movie.
                </div>
              ) : (
                detail.reviews.map((review) => {
                  const authorName =
                    review.author.displayUsername ?? review.author.username;
                  const avatarUrl =
                    review.author.avatarUrl ?? review.author.image;

                  return (
                    <article
                      key={review.id}
                      className="rounded-2xl border border-border/60 bg-card/30 p-5 transition-all hover:border-border"
                    >
                      <div className="mb-3 flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={`${review.author.username} avatar`}
                              className="h-9 w-9 rounded-full border border-border/70 object-cover"
                            />
                          ) : (
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-secondary text-xs font-semibold text-secondary-foreground">
                              {review.author.username.slice(0, 1).toUpperCase()}
                            </span>
                          )}

                          <div>
                            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                              <span>{authorName}</span>
                            </div>
                            <div className="mt-0.5 flex items-center gap-2">
                              <SpaceRatingDisplay
                                ratingOutOfFive={review.ratingOutOfFive}
                                size="sm"
                              />
                              <span className="text-[10px] text-muted-foreground">
                                {formatRatingOutOfFiveLabel(
                                  review.ratingOutOfFive,
                                ) ?? "Unrated"}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {formatRelativeTime(review.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Heart className="h-3 w-3" />
                          <span>{review.likeCount}</span>
                        </div>
                      </div>

                      {review.containsSpoilers ? (
                        <p className="mb-2 inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-200">
                          Spoilers
                        </p>
                      ) : null}

                      <p className="text-sm leading-relaxed text-foreground/90">
                        {review.content}
                      </p>
                    </article>
                  );
                })
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-8 lg:col-span-4">
          <section className="rounded-2xl border border-border/60 bg-card/35 p-5">
            <h2 className="mb-5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Stats
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                  <Rocket className="h-3 w-3" />
                  Overall Rating
                </span>
                <span className="font-medium text-foreground">
                  {globalRatingLabel ?? "Not available"}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                  <BookText className="h-3 w-3" />
                  Total Logs
                </span>
                <span className="font-medium text-foreground">
                  {detail.logsCount.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="h-3 w-3" />
                  Year Released
                </span>
                <span className="font-medium text-foreground">
                  {movie.releaseYear ?? "Unknown"}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                  <Clock3 className="h-3 w-3" />
                  Duration
                </span>
                <span className="font-medium text-foreground">
                  {runtimeLabel ?? "Unknown"}
                </span>
              </div>

              {languageLabel ? (
                <div className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <Languages className="h-3 w-3" />
                    Language
                  </span>
                  <span className="font-medium text-foreground">
                    {languageLabel}
                  </span>
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-2xl border border-border/60 bg-card/35 p-5">
            <h2 className="mb-5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Rating Breakdown
            </h2>

            <div className="space-y-2">
              {detail.ratingBreakdown.buckets.map((bucket) => (
                <div
                  key={`breakdown-${bucket.ratingValueOutOfFive}`}
                  className="flex items-center gap-2"
                >
                  <div className="flex w-12 shrink-0 items-center justify-end gap-1">
                    <span className="text-[10px] text-muted-foreground">
                      {formatRatingOutOfFiveLabel(bucket.ratingValueOutOfFive)}
                    </span>
                    <Rocket className="h-2.5 w-2.5 text-muted-foreground" />
                  </div>

                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary/60">
                    <div
                      className="h-full rounded-full bg-primary/60"
                      style={{ width: `${bucket.percentage}%` }}
                    />
                  </div>

                  <span className="w-8 shrink-0 text-right text-[10px] text-muted-foreground">
                    {bucket.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
