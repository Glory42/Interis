import { useState } from "react";
import { type SerialDetailReviewSort } from "@/features/serials/api";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { SerialActionsSidebar } from "@/features/serials/components/serial-detail/SerialActionsSidebar";
import { SerialDetailsMainSection } from "@/features/serials/components/serial-detail/SerialDetailsMainSection";
import { SerialDetailTopBar } from "@/features/serials/components/serial-detail/SerialDetailTopBar";
import { SerialReviewsSection } from "@/features/serials/components/serial-detail/SerialReviewsSection";
import { SerialSeasonsSection } from "@/features/serials/components/serial-detail/SerialSeasonsSection";
import { SERIAL_MODULE_STYLES } from "@/features/serials/components/serial-detail/styles";
import {
  useSeriesDetailView,
  useSeriesInteraction,
  useUpdateSeriesInteraction,
} from "@/features/serials/hooks/useSerials";

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

  const resolvedOpenSeasonNumber =
    openSeasonNumber === undefined
      ? (series.seasons[0]?.seasonNumber ?? null)
      : openSeasonNumber;

  const watchlisted = interactionQuery.data?.watchlisted ?? false;
  const liked = interactionQuery.data?.liked ?? false;
  const interactionRatingOutOfFive = interactionQuery.data?.ratingOutOfFive ?? null;
  const currentRatingOutOfFive =
    interactionRatingOutOfFive ?? detail.userRating?.ratingOutOfFive ?? null;
  const isInteractionBusy =
    interactionQuery.isPending || updateInteractionMutation.isPending;

  const handleToggleWatchlist = () => {
    void updateInteractionMutation.mutateAsync({ watchlisted: !watchlisted });
  };

  const handleToggleLike = () => {
    void updateInteractionMutation.mutateAsync({ liked: !liked });
  };

  const handleRatingChange = (nextRatingOutOfFive: number | null) => {
    if (!user || nextRatingOutOfFive === currentRatingOutOfFive) {
      return;
    }

    void updateInteractionMutation.mutateAsync({
      ratingOutOfFive: nextRatingOutOfFive,
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
      <SerialDetailTopBar title={series.title} />

      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[220px_1fr]">
          <SerialActionsSidebar
            detail={detail}
            currentRatingOutOfFive={currentRatingOutOfFive}
            isRatingSaving={updateInteractionMutation.isPending}
            onRatingChange={handleRatingChange}
            isAuthenticated={Boolean(user)}
            watchlisted={watchlisted}
            liked={liked}
            isInteractionBusy={isInteractionBusy}
            onToggleWatchlist={handleToggleWatchlist}
            onToggleLike={handleToggleLike}
          />

          <SerialDetailsMainSection detail={detail} />
        </div>

        <SerialReviewsSection
          reviewsSort={reviewsSort}
          onSortChange={setReviewsSort}
          reviews={detail.reviews}
        />

        <SerialSeasonsSection
          tmdbId={series.tmdbId}
          seasons={series.seasons}
          resolvedOpenSeasonNumber={resolvedOpenSeasonNumber}
          onToggleSeason={handleToggleSeason}
        />
      </main>
    </div>
  );
};
