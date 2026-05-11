import { useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { MusicDetailReviewSort } from "@/features/music/api";
import { AlbumActionsSidebar } from "@/features/music/components/music-detail/AlbumActionsSidebar";
import { AlbumDetailsMainSection } from "@/features/music/components/music-detail/AlbumDetailsMainSection";
import { AlbumDetailTopBar } from "@/features/music/components/music-detail/AlbumDetailTopBar";
import { AlbumReviewsSection } from "@/features/music/components/music-detail/AlbumReviewsSection";
import { MUSIC_MODULE_STYLES } from "@/features/music/components/music-detail/styles";
import { LogAlbumModal } from "@/features/music/components/LogAlbumModal";
import {
  useMusicDetailView,
  useMusicInteraction,
  useUpdateMusicInteraction,
} from "@/features/music/hooks/useMusic";

type MusicDetailPageProps = {
  mbid: string;
};

const MusicDetailStatusPanel = ({
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

export const MusicDetailPage = ({ mbid }: MusicDetailPageProps) => {
  const [reviewsSort, setReviewsSort] = useState<MusicDetailReviewSort>("popular");
  const [isLogOpen, setIsLogOpen] = useState(false);

  const detailQuery = useMusicDetailView(mbid, reviewsSort, mbid.length > 0);
  const { user } = useAuth();
  const interactionQuery = useMusicInteraction(mbid, Boolean(user) && mbid.length > 0);
  const updateInteractionMutation = useUpdateMusicInteraction(mbid);

  if (!mbid) {
    return <MusicDetailStatusPanel message="Invalid album id." />;
  }

  if (detailQuery.isPending) {
    return <MusicDetailStatusPanel message="Loading..." loading />;
  }

  if (detailQuery.isError || !detailQuery.data) {
    return <MusicDetailStatusPanel message="Could not load this album right now." />;
  }

  const detail = detailQuery.data;
  const album = detail.album;

  const wantToListen = interactionQuery.data?.wantToListen ?? false;
  const liked = interactionQuery.data?.liked ?? false;
  const interactionRatingOutOfFive = interactionQuery.data?.ratingOutOfFive ?? null;
  const currentRatingOutOfFive =
    interactionRatingOutOfFive ?? detail.userLog?.ratingOutOfFive ?? null;
  const isInteractionBusy =
    interactionQuery.isPending || updateInteractionMutation.isPending;

  return (
    <div className="min-h-screen">
      <AlbumDetailTopBar title={album.title} />

      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[220px_1fr]">
          <AlbumActionsSidebar
            detail={detail}
            currentRatingOutOfFive={currentRatingOutOfFive}
            isRatingSaving={updateInteractionMutation.isPending}
            onRatingChange={(nextRating) => {
              if (!user || nextRating === currentRatingOutOfFive) return;
              void updateInteractionMutation.mutateAsync({ ratingOutOfFive: nextRating });
            }}
            isAuthenticated={Boolean(user)}
            wantToListen={wantToListen}
            liked={liked}
            isInteractionBusy={isInteractionBusy}
            onToggleWantToListen={() => {
              void updateInteractionMutation.mutateAsync({ wantToListen: !wantToListen });
            }}
            onToggleLike={() => {
              void updateInteractionMutation.mutateAsync({ liked: !liked });
            }}
            onOpenLog={() => setIsLogOpen(true)}
          />

          <LogAlbumModal
            mbid={mbid}
            albumTitle={album.title}
            albumYear={album.firstReleaseYear}
            coverArtUrl={album.coverArtUrl}
            isOpen={isLogOpen}
            onClose={() => setIsLogOpen(false)}
          />

          <AlbumDetailsMainSection detail={detail} />
        </div>

        <AlbumReviewsSection
          reviewsSort={reviewsSort}
          onSortChange={setReviewsSort}
          reviews={detail.reviews}
        />
      </main>
    </div>
  );
};
