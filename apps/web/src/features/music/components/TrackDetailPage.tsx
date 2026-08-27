import { useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { TrackDetailReviewSort } from "@/features/music/track-api";
import { AlbumDetailTopBar } from "@/features/music/components/music-detail/AlbumDetailTopBar";
import { MUSIC_MODULE_STYLES } from "@/features/music/components/music-detail/styles";
import { TrackActionsSidebar } from "@/features/music/components/track-detail/TrackActionsSidebar";
import { TrackDetailsMainSection } from "@/features/music/components/track-detail/TrackDetailsMainSection";
import { TrackReviewsSection } from "@/features/music/components/track-detail/TrackReviewsSection";
import { LogTrackModal } from "@/features/music/components/LogTrackModal";
import {
  useTrackDetailView,
  useTrackInteraction,
  useUpdateTrackInteraction,
} from "@/features/music/hooks/useTracks";

type TrackDetailPageProps = {
  mbid: string;
};

const TrackDetailStatusPanel = ({
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
            borderColor: MUSIC_MODULE_STYLES.border,
            background: MUSIC_MODULE_STYLES.panel,
          }}
        />
      ) : (
        <div
          className="border p-5 font-mono text-xs"
          style={{
            borderColor: MUSIC_MODULE_STYLES.border,
            background: MUSIC_MODULE_STYLES.panel,
            color: MUSIC_MODULE_STYLES.muted,
          }}
        >
          {message}
        </div>
      )}
    </main>
  );
};

export const TrackDetailPage = ({ mbid }: TrackDetailPageProps) => {
  const [reviewsSort, setReviewsSort] = useState<TrackDetailReviewSort>("popular");
  const [isLogOpen, setIsLogOpen] = useState(false);

  const detailQuery = useTrackDetailView(mbid, reviewsSort, mbid.length > 0);
  const { user } = useAuth();
  const interactionQuery = useTrackInteraction(mbid, Boolean(user) && mbid.length > 0);
  const updateInteractionMutation = useUpdateTrackInteraction(mbid);

  if (!mbid) {
    return <TrackDetailStatusPanel message="Invalid track id." />;
  }

  if (detailQuery.isPending) {
    return <TrackDetailStatusPanel message="Loading..." loading />;
  }

  if (detailQuery.isError || !detailQuery.data) {
    return <TrackDetailStatusPanel message="Could not load this track right now." />;
  }

  const detail = detailQuery.data;
  const track = detail.track;

  const liked = interactionQuery.data?.liked ?? false;
  const interactionRating = interactionQuery.data?.rating ?? null;
  const currentRating = interactionRating ?? detail.userLog?.rating ?? null;
  const isInteractionBusy = interactionQuery.isPending || updateInteractionMutation.isPending;

  return (
    <div className="min-h-screen">
      <AlbumDetailTopBar title={track.title} />

      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[220px_1fr]">
          <TrackActionsSidebar
            detail={detail}
            currentRating={currentRating}
            isRatingSaving={updateInteractionMutation.isPending}
            onRatingChange={(nextRating) => {
              if (!user || nextRating === currentRating) return;
              void updateInteractionMutation.mutateAsync({ rating: nextRating });
            }}
            isAuthenticated={Boolean(user)}
            liked={liked}
            isInteractionBusy={isInteractionBusy}
            onToggleLike={() => {
              void updateInteractionMutation.mutateAsync({ liked: !liked });
            }}
            onOpenLog={() => setIsLogOpen(true)}
          />

          <LogTrackModal
            mbid={mbid}
            trackTitle={track.title}
            artistName={track.artistName}
            isOpen={isLogOpen}
            onClose={() => setIsLogOpen(false)}
          />

          <TrackDetailsMainSection detail={detail} />
        </div>

        <TrackReviewsSection
          reviewsSort={reviewsSort}
          onSortChange={setReviewsSort}
          reviews={detail.reviews}
        />
      </main>
    </div>
  );
};
