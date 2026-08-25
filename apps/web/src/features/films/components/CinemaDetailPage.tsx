import { useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { type MovieDetailReviewSort } from "@/features/films/api";
import { CinemaActionsSidebar } from "@/features/films/components/cinema-detail/CinemaActionsSidebar";
import { CinemaDetailsMainSection } from "@/features/films/components/cinema-detail/CinemaDetailsMainSection";
import { CinemaDetailStatusPanel } from "@/features/films/components/cinema-detail/CinemaDetailStatusPanel";
import { CinemaDetailTopBar } from "@/features/films/components/cinema-detail/CinemaDetailTopBar";
import { CinemaReviewsSection } from "@/features/films/components/cinema-detail/CinemaReviewsSection";
import { CinemaSimilarSection } from "@/features/films/components/cinema-detail/CinemaSimilarSection";
import { useMovieDetailView } from "@/features/films/hooks/useMovies";
import {
  useMovieInteraction,
  useUpdateMovieInteraction,
} from "@/features/interactions/hooks/useInteractions";

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
      <CinemaDetailTopBar title={movie.title} />

      <main className="mx-auto w-full max-w-5xl px-4 py-10">
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
          reviewsSort={reviewsSort}
          onSortChange={setReviewsSort}
          reviews={detail.reviews}
        />

        <CinemaSimilarSection similar={detail.similar} />
      </main>
    </div>
  );
}
