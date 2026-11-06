import type { UserInteractionMovie } from "@/features/profile/api";
import { MediaPosterGridItem } from "@/features/profile/components/MediaPosterGridItem";
import { PROFILE_MEDIA_GRID_CLASSES } from "@/features/profile/components/ProfileMediaGridSkeleton";
import type { MediaShelfFilter } from "@/features/profile/components/media-shelf-filter";

export type MediaFilter = MediaShelfFilter;

// Items arrive already filtered by the server; `filter` only words the empty state.
export const LikedMediaGrid = ({
  items,
  filter,
}: {
  items: UserInteractionMovie[];
  filter: MediaFilter;
}) => {
  if (items.length === 0) {
    return (
      <div className="border px-3 py-2 text-xs profile-shell-border profile-shell-muted profile-shell-panel">
        No {filter === "all" ? "items" : filter} liked yet.
      </div>
    );
  }

  return (
    <div className={PROFILE_MEDIA_GRID_CLASSES}>
      {items.map((item) => (
        <MediaPosterGridItem
          key={`media-${item.mediaType}-${item.tmdbId}`}
          item={item}
          interactionVerb="liked"
        />
      ))}
    </div>
  );
};
