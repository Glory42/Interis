import { useMemo } from "react";
import type { UserInteractionMovie } from "@/features/profile/api";
import { MediaPosterGridItem } from "@/features/profile/components/MediaPosterGridItem";
import { getMediaItemKey } from "@/features/profile/utils/media-item-key";
import { PROFILE_MEDIA_GRID_CLASSES } from "@/features/profile/components/ProfileMediaGridSkeleton";

export type MediaFilter = "all" | "cinema" | "serial" | "music" | "books";

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
    if (filter === "serial") return items.filter((i) => i.mediaType === "tv");
    if (filter === "music") return items.filter((i) => i.mediaType === "album");
    return items.filter((i) => i.mediaType === "book");
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
          key={getMediaItemKey(item, "media")}
          item={item}
          interactionVerb="liked"
        />
      ))}
    </div>
  );
};
