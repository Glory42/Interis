import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Award, CircleCheck, CircleDot, CirclePlus, Heart } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { type FilmDetailReviewSort } from "@/features/films/api";
import { FilmDetailsMainSection } from "@/features/films/components/film-detail/FilmDetailsMainSection";
import { MediaDetailStatusPanel } from "@/features/media/detail/MediaDetailStatusPanel";
import { MediaDetailSkeleton } from "@/components/ui/PageSkeletons";
import { FilmReviewsSection } from "@/features/films/components/film-detail/FilmReviewsSection";
import { UnwatchFilmDialog } from "@/features/films/components/film-detail/UnwatchFilmDialog";
import { FILM_MODULE_STYLES } from "@/features/media/styles";
import { useFilmDetailView } from "@/features/films/hooks/useFilms";
import {
  useFilmInteraction,
  useUpdateFilmInteraction,
} from "@/features/interactions/hooks/useInteractions";
import { LetterboxHero } from "@/features/media/detail/LetterboxHero";
import { MediaLogButton } from "@/features/media/detail/MediaLogButton";
import { MediaActionCard } from "@/features/media/detail/MediaActionCard";
import { BELOW_MD_QUERY, useMediaQuery } from "@/lib/use-media-query";
import { MediaSimilarSection } from "@/features/media/detail/MediaSimilarSection";
import {
  MediaActionsSidebar,
  type MediaAction,
} from "@/features/media/detail/MediaActionsSidebar";
import { getBackdropUrl, getPosterUrl } from "@/features/media/tmdb-images";
import { toLanguageLabel } from "@/features/media/labels";

type FilmDetailPageProps = {
  tmdbId: number;
};

export function FilmDetailPage({ tmdbId }: FilmDetailPageProps) {
  const isValidTmdbId = Number.isInteger(tmdbId) && tmdbId > 0;
  const [reviewsSort, setReviewsSort] =
    useState<FilmDetailReviewSort>("popular");
  const [isConfirmingUnwatch, setIsConfirmingUnwatch] = useState(false);

  const detailQuery = useFilmDetailView(tmdbId, reviewsSort, isValidTmdbId);

  const { user } = useAuth();
  const interactionQuery = useFilmInteraction(
    tmdbId,
    Boolean(user) && isValidTmdbId,
  );
  const updateInteractionMutation = useUpdateFilmInteraction(tmdbId);
  const isBelowMd = useMediaQuery(BELOW_MD_QUERY);

  if (!isValidTmdbId) {
    return (
      <MediaDetailStatusPanel
        message="Invalid movie id."
        moduleStyles={FILM_MODULE_STYLES}
      />
    );
  }

  if (detailQuery.isPending) {
    return <MediaDetailSkeleton label="Loading film" />;
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <MediaDetailStatusPanel
        message="Could not load this movie right now."
        moduleStyles={FILM_MODULE_STYLES}
      />
    );
  }

  const detail = detailQuery.data;
  const movie = detail.movie;
  const backdropUrl = movie.backdropPath
    ? getBackdropUrl(movie.backdropPath)
    : null;

  const watchlisted = interactionQuery.data?.watchlisted ?? false;
  const liked = interactionQuery.data?.liked ?? false;
  const watched = interactionQuery.data?.watched ?? false;
  const interactionRating = interactionQuery.data?.rating ?? null;
  const currentRating = interactionRating ?? detail.userRating?.rating ?? null;
  const isInteractionLoading = Boolean(user) && interactionQuery.isLoading;
  const isInteractionBusy =
    interactionQuery.isPending || updateInteractionMutation.isPending;

  const handleToggleWatchlist = () => {
    void updateInteractionMutation.mutateAsync({ watchlisted: !watchlisted });
  };

  const handleToggleLike = () => {
    void updateInteractionMutation.mutateAsync({ liked: !liked });
  };

  // A liked or rated movie asks first whether the like and rating go too,
  // so it isn't left "liked, rated, not watched" by accident (#93).
  const handleToggleWatched = () => {
    if (watched && (liked || interactionRating !== null)) {
      setIsConfirmingUnwatch(true);
      return;
    }
    void updateInteractionMutation.mutateAsync({ watched: !watched });
  };

  const handleConfirmUnwatch = (clearLikeAndRating: boolean) => {
    setIsConfirmingUnwatch(false);
    void updateInteractionMutation.mutateAsync(
      clearLikeAndRating
        ? { watched: false, liked: false, rating: null }
        : { watched: false },
    );
  };

  const handleRatingChange = (nextRating: number | null) => {
    if (!user || nextRating === currentRating) {
      return;
    }

    void updateInteractionMutation.mutateAsync({
      rating: nextRating,
    });
  };

  const actions: MediaAction[] = [
    {
      key: "watched",
      isActive: watched,
      activeIcon: <CircleDot />,
      inactiveIcon: <CircleDot />,
      activeLabel: "Watched",
      inactiveLabel: "Watch",
      onToggle: handleToggleWatched,
    },
    {
      key: "liked",
      isActive: liked,
      activeIcon: <Heart className="fill-current" />,
      inactiveIcon: <Heart />,
      activeLabel: "Liked",
      inactiveLabel: "Like",
      onToggle: handleToggleLike,
    },
    {
      key: "watchlist",
      isActive: watchlisted,
      activeIcon: <CircleCheck />,
      inactiveIcon: <CirclePlus />,
      activeLabel: "Watchlisted",
      inactiveLabel: "Watchlist",
      onToggle: handleToggleWatchlist,
    },
  ];

  const actionCard = (
    <MediaActionCard
      moduleStyles={FILM_MODULE_STYLES}
      logSlot={
        <MediaLogButton
          media={{
            kind: "film",
            tmdbId: movie.tmdbId,
            title: movie.title,
            year: movie.releaseYear,
            posterPath: movie.posterPath,
          }}
          rating={currentRating}
          hasLogged={Boolean(detail.userRating?.diaryEntryId)}
        />
      }
      tmdbId={movie.tmdbId}
      itemType="movie"
      viewerUsername={user?.username ?? null}
      lastWatchedDate={detail.userRating?.watchedDate ?? null}
      currentRating={currentRating}
      onRatingChange={handleRatingChange}
      isRatingSaving={updateInteractionMutation.isPending}
      isAuthenticated={Boolean(user)}
      isInteractionBusy={isInteractionBusy}
      isInteractionLoading={isInteractionLoading}
      actions={actions}
    />
  );

  return (
    <div className="min-h-screen">
      <LetterboxHero
        backdropUrl={backdropUrl}
        slateLeft={[
          "Interis",
          "Film",
          ...(movie.releaseYear ? [String(movie.releaseYear)] : []),
        ]}
        slateRight={[
          toLanguageLabel(movie.languageCode),
          movie.productionCountries[0] ?? null,
        ].filter((part): part is string => Boolean(part))}
      />

      <main className="relative z-10 mx-auto -mt-20 w-full max-w-5xl px-4 pb-10 sm:-mt-28">
        <Link
          to="/movies"
          className="mb-4 inline-flex items-center gap-1.5 font-mono text-[11px]"
          style={{ color: FILM_MODULE_STYLES.muted }}
          viewTransition
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Films</span>
        </Link>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-[220px_1fr]">
          <MediaActionsSidebar
            moduleStyles={FILM_MODULE_STYLES}
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
                  style={{ background: FILM_MODULE_STYLES.panelSoft }}
                >
                  <div
                    className="flex h-8 w-8 items-center justify-center"
                    style={{ background: FILM_MODULE_STYLES.panelStrong }}
                  >
                    <Award
                      className="h-4 w-4"
                      style={{ color: FILM_MODULE_STYLES.accent }}
                    />
                  </div>
                  <span
                    className="font-mono text-[8px] uppercase tracking-[0.22em]"
                    style={{ color: FILM_MODULE_STYLES.faint }}
                  >
                    No Art
                  </span>
                </div>
              )
            }
          >
            {isBelowMd ? null : actionCard}
          </MediaActionsSidebar>

          <FilmDetailsMainSection detail={detail} actionsSlot={isBelowMd ? actionCard : null} />
        </div>

        {isConfirmingUnwatch ? (
          <UnwatchFilmDialog
            onConfirm={handleConfirmUnwatch}
            onClose={() => setIsConfirmingUnwatch(false)}
          />
        ) : null}

        <FilmReviewsSection
          key={reviewsSort}
          tmdbId={tmdbId}
          reviewsSort={reviewsSort}
          onSortChange={setReviewsSort}
          reviews={detail.reviews}
          reviewsLimit={detail.reviewsLimit}
          reviewsHasMore={detail.reviewsHasMore}
        />

        <MediaSimilarSection
          heading="Similar Movies"
          items={detail.similar.map((item) => ({
            ...item,
            year: item.releaseYear,
          }))}
          moduleStyles={FILM_MODULE_STYLES}
          getPosterUrl={getPosterUrl}
          detailRoute="/movies/$tmdbId"
        />
      </main>
    </div>
  );
}
