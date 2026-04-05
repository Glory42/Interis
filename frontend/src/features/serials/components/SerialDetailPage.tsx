import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookText,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Clock3,
  Heart,
  Languages,
  Play,
  RadioTower,
  Rocket,
  Rows3,
  Star,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  SpaceRatingDisplay,
  SpaceRatingInput,
} from "@/features/films/components/SpaceRating";
import { formatRatingOutOfFiveLabel } from "@/features/films/components/spaceRating.utils";
import { type SerialDetailReviewSort } from "@/features/serials/api";
import { LogSeriesModal } from "@/features/serials/components/LogSeriesModal";
import {
  formatEpisodeRuntimeLabel,
  getBackdropUrl,
  getPosterUrl,
  getStillUrl,
  toLanguageLabel,
} from "@/features/serials/components/utils";
import {
  useSeriesDetailView,
  useSeriesInteraction,
  useSeriesSeasonDetail,
  useUpdateSeriesInteraction,
} from "@/features/serials/hooks/useSerials";
import { cn } from "@/lib/utils";

const toDateLabel = (value: string | null): string | null => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(parsed);
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

type SerialDetailPageProps = {
  tmdbId: number;
};

type SeasonAccordionItemProps = {
  tmdbId: number;
  season: {
    id: number;
    seasonNumber: number;
    name: string;
    episodeCount: number | null;
    airDate: string | null;
    posterPath: string | null;
  };
  isOpen: boolean;
  onToggle: () => void;
};

const toEpisodeCodeLabel = (episodeNumber: number): string => {
  return `E${String(episodeNumber).padStart(2, "0")}`;
};

const toYearFromDateLabel = (value: string | null): string => {
  if (!value || value.length < 4) {
    return "Year unknown";
  }

  return value.slice(0, 4);
};

const SeasonAccordionItem = ({
  tmdbId,
  season,
  isOpen,
  onToggle,
}: SeasonAccordionItemProps) => {
  const seasonDetailQuery = useSeriesSeasonDetail(tmdbId, season.seasonNumber, isOpen);

  return (
    <div className="overflow-hidden  border border-border/60 bg-card/30">
      <button
        type="button"
        className="group flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-secondary/25"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center  border border-border/60 bg-secondary/60">
            <span className="text-xs font-black text-primary">{season.seasonNumber}</span>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
              {season.name || `Season ${season.seasonNumber}`}
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              <span>{season.episodeCount ?? "?"} episodes</span>
              <span> · </span>
              <span>{toYearFromDateLabel(season.airDate)}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-primary">
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {isOpen ? (
        <div className="overflow-hidden">
          <div className="divide-y divide-border/45 border-t border-border/55">
            {seasonDetailQuery.isPending ? (
              <div className="p-4 text-xs text-muted-foreground">Loading episodes...</div>
            ) : null}

            {seasonDetailQuery.isError ? (
              <div className="p-4 text-xs text-destructive">
                Could not load episodes for this season.
              </div>
            ) : null}

            {!seasonDetailQuery.isPending &&
            !seasonDetailQuery.isError &&
            (seasonDetailQuery.data?.episodes.length ?? 0) === 0 ? (
              <div className="p-4 text-xs text-muted-foreground">
                No episodes available for this season.
              </div>
            ) : null}

            {!seasonDetailQuery.isPending &&
            !seasonDetailQuery.isError &&
            seasonDetailQuery.data?.episodes ?
              seasonDetailQuery.data.episodes.map((episode) => (
                <article
                  key={`episode-${episode.id}`}
                  className="group/ep flex gap-4 p-4 transition-colors hover:bg-secondary/20"
                >
                  <div className="relative h-16 w-28 shrink-0 overflow-hidden  border border-border/60 bg-secondary/40">
                    <img
                      alt={episode.name}
                      className="h-full w-full object-cover opacity-80 transition-opacity group-hover/ep:opacity-100"
                      src={getStillUrl(episode.stillPath)}
                    />

                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover/ep:opacity-100">
                      <div className="flex h-8 w-8 items-center justify-center  border border-white/20 bg-white/15 backdrop-blur-sm">
                        <Play className="ml-0.5 h-3 w-3 text-white" />
                      </div>
                    </div>

                    {episode.runtimeLabel ? (
                      <div className="absolute bottom-1 right-1  bg-black/60 px-1.5 py-0.5 font-mono text-[9px] text-slate-300 backdrop-blur-sm">
                        {episode.runtimeLabel}
                      </div>
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                        {toEpisodeCodeLabel(episode.episodeNumber)}
                      </span>
                      <h4 className="truncate text-sm font-semibold text-foreground transition-colors group-hover/ep:text-primary">
                        {episode.name}
                      </h4>
                    </div>

                    <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {episode.overview || "No synopsis available for this episode."}
                    </p>

                    <p className="mt-1.5 font-mono text-[10px] text-muted-foreground/85">
                      {toDateLabel(episode.airDate) ?? "Air date unknown"}
                    </p>
                  </div>
                </article>
              ))
            : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export const SerialDetailPage = ({ tmdbId }: SerialDetailPageProps) => {
  const isValidTmdbId = Number.isInteger(tmdbId) && tmdbId > 0;
  const [reviewsSort, setReviewsSort] = useState<SerialDetailReviewSort>("popular");
  const [draftRatingOutOfFive, setDraftRatingOutOfFive] = useState<number | null>(null);
  const [openSeasonNumber, setOpenSeasonNumber] = useState<number | null | undefined>(
    undefined,
  );
  const detailQuery = useSeriesDetailView(tmdbId, reviewsSort, isValidTmdbId);

  const { user } = useAuth();
  const interactionQuery = useSeriesInteraction(
    tmdbId,
    Boolean(user) && isValidTmdbId,
  );
  const updateInteractionMutation = useUpdateSeriesInteraction(tmdbId);

  if (!isValidTmdbId) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className=" border border-border/70 bg-card/60 p-5 text-sm text-muted-foreground">
          Invalid series id.
        </div>
      </div>
    );
  }

  if (detailQuery.isPending) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-12">
        <div className="h-64 animate-pulse  border border-border/60 bg-card/35" />
      </div>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className=" border border-destructive/45 bg-destructive/10 p-5 text-sm text-destructive">
          Could not load this series right now.
        </div>
      </div>
    );
  }

  const detail = detailQuery.data;
  const series = detail.series;

  const heroImageUrl = series.backdropPath
    ? getBackdropUrl(series.backdropPath)
    : getPosterUrl(series.posterPath);

  const runtimeLabel = formatEpisodeRuntimeLabel(series.episodeRuntime);
  const languageLabel = toLanguageLabel(series.languageCode);
  const firstAirDateLabel = toDateLabel(series.firstAirDate);
  const lastAirDateLabel = toDateLabel(series.lastAirDate);
  const globalRatingLabel = formatRatingOutOfFiveLabel(series.globalRatingOutOfFive);
  const resolvedOpenSeasonNumber =
    openSeasonNumber === undefined
      ? (series.seasons[0]?.seasonNumber ?? null)
      : openSeasonNumber;

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
          alt=""
          aria-hidden="true"
          className="theme-hero-media h-full w-full object-cover opacity-25"
        />
        <div className="theme-hero-gradient-layer pointer-events-none absolute inset-0" />
        <div className="theme-hero-pattern-layer pointer-events-none absolute inset-0" />
        <div className="theme-hero-readable-overlay pointer-events-none absolute inset-y-0 left-0 w-[74%] bg-linear-to-r from-background/78 via-background/34 to-transparent" />
        <div className="theme-hero-readable-overlay pointer-events-none absolute inset-x-0 bottom-0 h-[54%] bg-linear-to-t from-background/74 via-background/26 to-transparent" />

        <div className="absolute left-0 right-0 top-6 z-[22] mx-auto w-full max-w-7xl px-4">
          <Button
            asChild
            variant="outline"
            size="sm"
            className=" bg-background/45 backdrop-blur-sm"
          >
            <Link to="/serials" viewTransition>
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
          </Button>
        </div>

        <div className="theme-hero-safe-area mx-auto w-full max-w-7xl px-4">
          <div className="theme-hero-safe-content flex w-full items-end gap-6">
            <div className="-mb-4 hidden shrink-0 sm:block">
              <div className="h-40 w-28 overflow-hidden  border border-border/60 shadow-2xl">
                <img
                  src={getPosterUrl(series.posterPath)}
                  alt={`${series.title} poster`}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            <div className="flex-1 pb-1">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px]">
                <RadioTower className="h-3 w-3 text-primary" />
                <span className="theme-kicker font-bold uppercase tracking-[0.16em] text-primary">
                  Serials
                </span>
                {series.firstAirYear ? (
                  <>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">{series.firstAirYear}</span>
                  </>
                ) : null}
                {series.genres.length > 0 ? (
                  <span className=" bg-secondary/75 px-2 py-0.5 text-muted-foreground">
                    {series.genres
                      .slice(0, 2)
                      .map((genre) => genre.name)
                      .join(" / ")}
                  </span>
                ) : null}
              </div>

              <h1 className="theme-display-title text-4xl font-black leading-none tracking-tight text-foreground">
                {series.title}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {series.creator ?? "Creator unknown"}
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
                ratingOutOfFive={series.globalRatingOutOfFive}
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

            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Rows3 className="h-3.5 w-3.5" />
              <span>{series.numberOfSeasons ?? "?"} seasons</span>
            </div>

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
              {series.overview || "No synopsis available for this series."}
            </p>
          </section>

          <section className=" border border-border/60 bg-card/35 p-5">
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

              <div className=" border border-border/70 bg-secondary/35 px-3 py-1.5 text-sm font-semibold text-foreground">
                {formatRatingOutOfFiveLabel(draftRatingOutOfFive) ??
                  formatRatingOutOfFiveLabel(
                    detail.userRating?.ratingOutOfFive ?? null,
                  ) ??
                  "No rating yet"}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <LogSeriesModal
                tmdbId={series.tmdbId}
                seriesTitle={series.title}
                seriesFirstAirYear={series.firstAirYear}
                seriesPosterPath={series.posterPath}
                initialState={modalInitialState}
              />

              <Button
                type="button"
                variant="outline"
                className=""
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
                className=""
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

              <div className="theme-segment-shell flex  border border-border/70 bg-card/50 p-1">
                <button
                  type="button"
                  className={cn(
                    " px-3 py-1.5 text-xs font-medium transition-all",
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
                    " px-3 py-1.5 text-xs font-medium transition-all",
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
                <div className=" border border-border/60 bg-card/30 p-4 text-sm text-muted-foreground">
                  No reviews yet for this series.
                </div>
              ) : (
                detail.reviews.map((review) => {
                  const authorName =
                    review.author.displayUsername ?? review.author.username;
                  const avatarUrl = review.author.avatarUrl ?? review.author.image;

                  return (
                    <article
                      key={review.id}
                      className=" border border-border/60 bg-card/30 p-5 transition-all hover:border-border"
                    >
                      <div className="mb-3 flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={`${review.author.username} avatar`}
                              className="h-9 w-9  border border-border/70 object-cover"
                            />
                          ) : (
                            <span className="inline-flex h-9 w-9 items-center justify-center  border border-border/70 bg-secondary text-xs font-semibold text-secondary-foreground">
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
                        <p className="mb-2 inline-flex  border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-200">
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

          <section>
            <h2 className="mb-4 text-base font-bold text-foreground">Seasons</h2>
            {series.seasons.length === 0 ? (
              <div className=" border border-border/60 bg-card/30 p-4 text-sm text-muted-foreground">
                No season metadata available.
              </div>
            ) : (
              <div className="space-y-3">
                {series.seasons.map((season) => (
                  <SeasonAccordionItem
                    key={`season-${season.id}`}
                    tmdbId={series.tmdbId}
                    season={season}
                    isOpen={resolvedOpenSeasonNumber === season.seasonNumber}
                    onToggle={() => {
                      setOpenSeasonNumber((currentSeasonNumber) => {
                        const currentResolvedSeasonNumber =
                          currentSeasonNumber === undefined
                            ? (series.seasons[0]?.seasonNumber ?? null)
                            : currentSeasonNumber;

                        if (currentResolvedSeasonNumber === season.seasonNumber) {
                          return null;
                        }

                        return season.seasonNumber;
                      });
                    }}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-8 lg:col-span-4">
          <section className=" border border-border/60 bg-card/35 p-5">
            <h2 className="mb-5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Stats
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                  <Star className="h-3 w-3" />
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
                  <Rows3 className="h-3 w-3" />
                  Seasons
                </span>
                <span className="font-medium text-foreground">
                  {series.numberOfSeasons ?? "Unknown"}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                  <RadioTower className="h-3 w-3" />
                  Episodes
                </span>
                <span className="font-medium text-foreground">
                  {series.numberOfEpisodes ?? "Unknown"}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="h-3 w-3" />
                  First Air Date
                </span>
                <span className="font-medium text-foreground">
                  {firstAirDateLabel ?? "Unknown"}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="h-3 w-3" />
                  Last Air Date
                </span>
                <span className="font-medium text-foreground">
                  {lastAirDateLabel ?? "Unknown"}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                  <Clock3 className="h-3 w-3" />
                  Runtime
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
                  <span className="font-medium text-foreground">{languageLabel}</span>
                </div>
              ) : null}
            </div>
          </section>

          <section className=" border border-border/60 bg-card/35 p-5">
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

                  <div className="h-1.5 flex-1 overflow-hidden  bg-secondary/60">
                    <div
                      className="h-full  bg-primary/60"
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

          <section className=" border border-border/60 bg-card/35 p-5">
            <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Production
            </h2>
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">Creator:</span>{" "}
                {series.creator ?? "Unknown"}
              </p>
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">Network:</span>{" "}
                {series.network ?? "Unknown"}
              </p>
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">Status:</span>{" "}
                {series.status ?? "Unknown"}
              </p>
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">In Production:</span>{" "}
                {series.inProduction === null
                  ? "Unknown"
                  : series.inProduction
                    ? "Yes"
                    : "No"}
              </p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};
