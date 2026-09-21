import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Award, Check } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { type MovieDetailReviewSort } from "@/features/movies/api";
import { LogMovieModal } from "@/features/diary/components/LogMovieModal";
import { MovieDetailsMainSection } from "@/features/movies/components/movie-detail/MovieDetailsMainSection";
import { MediaDetailStatusPanel } from "@/features/media/detail/MediaDetailStatusPanel";
import { MovieReviewsSection } from "@/features/movies/components/movie-detail/MovieReviewsSection";
import { MOVIE_MODULE_STYLES } from "@/features/media/styles";
import { getBackdropUrl, getPosterUrl } from "@/features/movies/components/utils";
import { useMovieDetailView } from "@/features/movies/hooks/useMovies";
import {
  useMovieInteraction,
  useUpdateMovieInteraction,
} from "@/features/interactions/hooks/useInteractions";
import { MediaDetailBackdrop } from "@/features/media/detail/MediaDetailBackdrop";
import { MediaSimilarSection } from "@/features/media/detail/MediaSimilarSection";
import { MediaActionsSidebar } from "@/features/media/detail/MediaActionsSidebar";

type MovieDetailPageProps = {
  tmdbId: number;
};

export function MovieDetailPage({ tmdbId }: MovieDetailPageProps) {
  const isValidTmdbId = Number.isInteger(tmdbId) && tmdbId > 0;
  const [reviewsSort, setReviewsSort] =
    useState<MovieDetailReviewSort>("popular");

  const detailQuery = useMovieDetailView(tmdbId, reviewsSort, isValidTmdbId);

  const { user } = useAuth();
  const interactionQuery = useMovieInteraction(
    tmdbId,
    Boolean(user) && isValidTmdbId,
  );
  const updateInteractionMutation = useUpdateMovieInteraction(tmdbId);

  if (!isValidTmdbId) {
    return <MediaDetailStatusPanel message="Invalid movie id." moduleStyles={MOVIE_MODULE_STYLES} />;
  }

  if (detailQuery.isPending) {
    return <MediaDetailStatusPanel message="Loading..." moduleStyles={MOVIE_MODULE_STYLES} loading />;
  }

  if (detailQuery.isError || !detailQuery.data) {
    return <MediaDetailStatusPanel message="Could not load this movie right now." moduleStyles={MOVIE_MODULE_STYLES} />;
  }

  const detail = detailQuery.data;
  const movie = detail.movie;
  const backdropUrl = movie.backdropPath ? getBackdropUrl(movie.backdropPath) : null;

  const watchlisted = interactionQuery.data?.watchlisted ?? false;
  const liked = interactionQuery.data?.liked ?? false;
  const watched = interactionQuery.data?.watched ?? false;
  const interactionRating = interactionQuery.data?.rating ?? null;
  const currentRating =
    interactionRating ?? detail.userRating?.rating ?? null;
  const isInteractionLoading = Boolean(user) && interactionQuery.isLoading;
  const isInteractionBusy =
    interactionQuery.isPending || updateInteractionMutation.isPending;

  const modalInitialState = {
    watchedDate: detail.userRating?.watchedDate ?? null,
    rating: currentRating,
    rewatch: detail.userRating?.rewatch ?? false,
    reviewContent: detail.userRating?.reviewContent ?? null,
    containsSpoilers: detail.userRating?.reviewContainsSpoilers ?? null,
  };

  const handleToggleWatchlist = () => {
    void updateInteractionMutation.mutateAsync({ watchlisted: !watchlisted });
  };

  const handleToggleLike = () => {
    void updateInteractionMutation.mutateAsync({ liked: !liked });
  };

  const handleToggleWatched = () => {
    void updateInteractionMutation.mutateAsync({ watched: !watched });
  };

  const handleRatingChange = (nextRating: number | null) => {
    if (!user || nextRating === currentRating) {
      return;
    }

    void updateInteractionMutation.mutateAsync({
      rating: nextRating,
    });
  };

  return (
    <div className="min-h-screen">
      <div className="relative h-[42vh] max-h-135 min-h-80 w-full overflow-hidden">
        <MediaDetailBackdrop backdropUrl={backdropUrl} accentColor={MOVIE_MODULE_STYLES.accent} />
      </div>

      <main className="relative z-10 mx-auto -mt-20 w-full max-w-5xl px-4 pb-10 sm:-mt-28">
        <Link
          to="/movies"
          className="mb-4 inline-flex items-center gap-1.5 font-mono text-[11px]"
          style={{ color: MOVIE_MODULE_STYLES.muted }}
          viewTransition
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Movie</span>
        </Link>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-[220px_1fr]">
          <MediaActionsSidebar
            moduleStyles={MOVIE_MODULE_STYLES}
            posterSlot={
              movie.posterPath ? (
                <img
                  src={getPosterUrl(movie.posterPath)}
                  alt={`${movie.title} poster`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div
                  className="flex h-full w-full flex-col items-center justify-center gap-2"
                  style={{ background: MOVIE_MODULE_STYLES.panelSoft }}
                >
                  <div
                    className="flex h-8 w-8 items-center justify-center"
                    style={{ background: MOVIE_MODULE_STYLES.panelStrong }}
                  >
                    <Award className="h-4 w-4" style={{ color: MOVIE_MODULE_STYLES.accent }} />
                  </div>
                  <span
                    className="font-mono text-[8px] uppercase tracking-[0.22em]"
                    style={{ color: MOVIE_MODULE_STYLES.faint }}
                  >
                    No Art
                  </span>
                </div>
              )
            }
            logModalSlot={
              <LogMovieModal
                tmdbId={movie.tmdbId}
                movieTitle={movie.title}
                movieReleaseYear={movie.releaseYear}
                moviePosterPath={movie.posterPath}
                initialState={modalInitialState}
                triggerVariant="outline"
                triggerLabel="Log"
                triggerClassName="h-auto flex-1 rounded-full border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em]"
                triggerContent={
                  <>
                    <Check className="h-3 w-3" />
                    <span>Log</span>
                  </>
                }
              />
            }
            tmdbId={movie.tmdbId}
            itemType="movie"
            currentRating={currentRating}
            isRatingSaving={updateInteractionMutation.isPending}
            onRatingChange={handleRatingChange}
            isAuthenticated={Boolean(user)}
            watchlisted={watchlisted}
            liked={liked}
            watched={watched}
            isInteractionBusy={isInteractionBusy}
            isInteractionLoading={isInteractionLoading}
            onToggleWatchlist={handleToggleWatchlist}
            onToggleLike={handleToggleLike}
            onToggleWatched={handleToggleWatched}
          />

          <MovieDetailsMainSection detail={detail} />
        </div>

        <MovieReviewsSection
          key={reviewsSort}
          tmdbId={tmdbId}
          reviewsSort={reviewsSort}
          onSortChange={setReviewsSort}
          reviews={detail.reviews}
          reviewsLimit={detail.reviewsLimit}
          reviewsHasMore={detail.reviewsHasMore}
        />

        <MediaSimilarSection
          heading="Similar Films"
          items={detail.similar.map((item) => ({ ...item, year: item.releaseYear }))}
          moduleStyles={MOVIE_MODULE_STYLES}
          getPosterUrl={getPosterUrl}
          detailRoute="/movies/$tmdbId"
        />
      </main>
    </div>
  );
}
