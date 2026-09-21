import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { type SerialDetailReviewSort } from "@/features/serials/api";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { SerialActionsSidebar } from "@/features/serials/components/serial-detail/SerialActionsSidebar";
import { SerialDetailsMainSection } from "@/features/serials/components/serial-detail/SerialDetailsMainSection";
import { SerialReviewsSection } from "@/features/serials/components/serial-detail/SerialReviewsSection";
import { SerialSeasonsSection } from "@/features/serials/components/serial-detail/SerialSeasonsSection";
import { SerialSimilarSection } from "@/features/serials/components/serial-detail/SerialSimilarSection";
import { SERIAL_MODULE_STYLES } from "@/features/serials/components/serial-detail/styles";
import { getBackdropUrl } from "@/features/serials/components/utils";
import {
  useSeriesDetailView,
  useSeriesInteraction,
  useUpdateSeriesInteraction,
} from "@/features/serials/hooks/useSerials";
import { MediaDetailBackdrop } from "@/features/media-archive/components/MediaDetailBackdrop";

type SerialDetailPageProps = {
  tmdbId: number;
};

const SerialDetailStatusPanel = ({
  message,
  loading = false,
}: {
  message: string;
  loading?: boolean;
}) => {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      {loading ? (
        <div
          className="h-64 animate-pulse border"
          style={{
            borderColor: SERIAL_MODULE_STYLES.border,
            background: SERIAL_MODULE_STYLES.panel,
          }}
        />
      ) : (
        <div
          className="border p-5 font-mono text-xs"
          style={{
            borderColor: SERIAL_MODULE_STYLES.border,
            background: SERIAL_MODULE_STYLES.panel,
            color: SERIAL_MODULE_STYLES.muted,
          }}
        >
          {message}
        </div>
      )}
    </main>
  );
};

export const SerialDetailPage = ({ tmdbId }: SerialDetailPageProps) => {
  const isValidTmdbId = Number.isInteger(tmdbId) && tmdbId > 0;
  const [reviewsSort, setReviewsSort] =
    useState<SerialDetailReviewSort>("popular");
  const [openSeasonNumber, setOpenSeasonNumber] = useState<
    number | null | undefined
  >(undefined);

  const detailQuery = useSeriesDetailView(tmdbId, reviewsSort, isValidTmdbId);

  const { user } = useAuth();
  const interactionQuery = useSeriesInteraction(
    tmdbId,
    Boolean(user) && isValidTmdbId,
  );
  const updateInteractionMutation = useUpdateSeriesInteraction(tmdbId);

  if (!isValidTmdbId) {
    return <SerialDetailStatusPanel message="Invalid series id." />;
  }

  if (detailQuery.isPending) {
    return <SerialDetailStatusPanel message="Loading..." loading />;
  }

  if (detailQuery.isError || !detailQuery.data) {
    return <SerialDetailStatusPanel message="Could not load this series right now." />;
  }

  const detail = detailQuery.data;
  const series = detail.series;
  const backdropUrl = series.backdropPath ? getBackdropUrl(series.backdropPath) : null;

  const resolvedOpenSeasonNumber =
    openSeasonNumber === undefined
      ? (series.seasons[0]?.seasonNumber ?? null)
      : openSeasonNumber;

  const watchlisted = interactionQuery.data?.watchlisted ?? false;
  const liked = interactionQuery.data?.liked ?? false;
  const watched = interactionQuery.data?.watched ?? false;
  const interactionRating = interactionQuery.data?.rating ?? null;
  const currentRating =
    interactionRating ?? detail.userRating?.rating ?? null;
  // Only gate on the initial load - once loaded, toggles apply optimistically
  // and shouldn't visually lock while the (TMDB-backed, sometimes
  // multi-second) cascade request is still in flight in the background.
  const isInteractionBusy = interactionQuery.isPending;

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

  const handleToggleSeason = (seasonNumber: number) => {
    setOpenSeasonNumber((currentSeasonNumber) => {
      const currentResolvedSeasonNumber =
        currentSeasonNumber === undefined
          ? (series.seasons[0]?.seasonNumber ?? null)
          : currentSeasonNumber;

      if (currentResolvedSeasonNumber === seasonNumber) {
        return null;
      }

      return seasonNumber;
    });
  };

  return (
    <div className="min-h-screen">
      <div className="relative h-[42vh] max-h-135 min-h-80 w-full overflow-hidden">
        <MediaDetailBackdrop backdropUrl={backdropUrl} accentColor={SERIAL_MODULE_STYLES.accent} />
      </div>

      <main className="relative z-10 mx-auto -mt-20 w-full max-w-5xl px-4 pb-10 sm:-mt-28">
        <Link
          to="/serials"
          className="mb-4 inline-flex items-center gap-1.5 font-mono text-[11px]"
          style={{ color: SERIAL_MODULE_STYLES.muted }}
          viewTransition
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Serials</span>
        </Link>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-[220px_1fr]">
          <SerialActionsSidebar
            detail={detail}
            currentRating={currentRating}
            isRatingSaving={updateInteractionMutation.isPending}
            onRatingChange={handleRatingChange}
            isAuthenticated={Boolean(user)}
            watchlisted={watchlisted}
            liked={liked}
            watched={watched}
            isInteractionBusy={isInteractionBusy}
            onToggleWatchlist={handleToggleWatchlist}
            onToggleLike={handleToggleLike}
            onToggleWatched={handleToggleWatched}
          />

          <SerialDetailsMainSection detail={detail} />
        </div>

        <SerialReviewsSection
          key={reviewsSort}
          tmdbId={series.tmdbId}
          reviewsSort={reviewsSort}
          onSortChange={setReviewsSort}
          reviews={detail.reviews}
          reviewsLimit={detail.reviewsLimit}
          reviewsHasMore={detail.reviewsHasMore}
        />

        <SerialSeasonsSection
          tmdbId={series.tmdbId}
          seasons={series.seasons}
          resolvedOpenSeasonNumber={resolvedOpenSeasonNumber}
          onToggleSeason={handleToggleSeason}
        />

        <SerialSimilarSection similar={detail.similar} />
      </main>
    </div>
  );
};
