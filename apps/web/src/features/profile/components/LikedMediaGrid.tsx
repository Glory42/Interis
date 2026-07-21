import { useMemo } from "react";
import type { UserInteractionMovie } from "@/features/profile/api";
import { MediaPosterGridItem } from "@/features/profile/components/MediaPosterGridItem";
import { PROFILE_MEDIA_GRID_CLASSES } from "@/features/profile/components/ProfileMediaGridSkeleton";

export type MediaFilter = "all" | "cinema" | "serial";

export const LikedMediaGrid = ({
  items,
  filter,
}: {
  items: UserInteractionMovie[];
  filter: MediaFilter;
}) => {
  const filtered = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "cinema") return items.filter((i) => i.mediaType === "movie");
    return items.filter((i) => i.mediaType === "tv");
  }, [items, filter]);

  if (filtered.length === 0) {
    return (
      <div className="border px-3 py-2 text-xs profile-shell-border profile-shell-muted profile-shell-panel">
        No {filter === "all" ? "items" : filter} liked yet.
      </div>
    );
  }

  return (
    <div className={PROFILE_MEDIA_GRID_CLASSES}>
      {filtered.map((item) => (
        <MediaPosterGridItem
          key={`media-${item.mediaType}-${item.tmdbId}`}
          item={item}
          interactionVerb="liked"
        />
      ))}
    </div>
  );
};
