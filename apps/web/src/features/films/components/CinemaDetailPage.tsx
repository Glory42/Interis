import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { type MovieDetailReviewSort } from "@/features/films/api";
import { CinemaActionsSidebar } from "@/features/films/components/cinema-detail/CinemaActionsSidebar";
import { CinemaDetailsMainSection } from "@/features/films/components/cinema-detail/CinemaDetailsMainSection";
import { CinemaDetailStatusPanel } from "@/features/films/components/cinema-detail/CinemaDetailStatusPanel";
import { CinemaReviewsSection } from "@/features/films/components/cinema-detail/CinemaReviewsSection";
import { CinemaSimilarSection } from "@/features/films/components/cinema-detail/CinemaSimilarSection";
import { CINEMA_MODULE_STYLES } from "@/features/films/components/cinema-detail/styles";
import { getBackdropUrl } from "@/features/films/components/utils";
import { useMovieDetailView } from "@/features/films/hooks/useMovies";
import {
  useMovieInteraction,
  useUpdateMovieInteraction,
} from "@/features/interactions/hooks/useInteractions";
import { MediaDetailBackdrop } from "@/features/media-archive/components/MediaDetailBackdrop";

type CinemaDetailPageProps = {
  tmdbId: number;
};

export function CinemaDetailPage({ tmdbId }: CinemaDetailPageProps) {
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
    return <CinemaDetailStatusPanel message="Invalid movie id." />;
  }

  if (detailQuery.isPending) {
    return <CinemaDetailStatusPanel message="Loading..." loading />;
  }

  if (detailQuery.isError || !detailQuery.data) {
    return <CinemaDetailStatusPanel message="Could not load this movie right now." />;
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
        <MediaDetailBackdrop backdropUrl={backdropUrl} accentColor={CINEMA_MODULE_STYLES.accent} />
      </div>

      <main className="relative z-10 mx-auto -mt-20 w-full max-w-5xl px-4 pb-10 sm:-mt-28">
        <Link
          to="/cinema"
          className="mb-4 inline-flex items-center gap-1.5 font-mono text-[11px]"
          style={{ color: CINEMA_MODULE_STYLES.muted }}
          viewTransition
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Cinema</span>
        </Link>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-[220px_1fr]">
          <CinemaActionsSidebar
            detail={detail}
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

          <CinemaDetailsMainSection detail={detail} />
        </div>

        <CinemaReviewsSection
          key={reviewsSort}
          tmdbId={tmdbId}
          reviewsSort={reviewsSort}
          onSortChange={setReviewsSort}
          reviews={detail.reviews}
          reviewsLimit={detail.reviewsLimit}
          reviewsHasMore={detail.reviewsHasMore}
        />

        <CinemaSimilarSection similar={detail.similar} />
      </main>
    </div>
  );
}
