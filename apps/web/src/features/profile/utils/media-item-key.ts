import type { UserInteractionMovie } from "@/features/profile/api";

export const getMediaItemKey = (item: UserInteractionMovie, prefix: string): string => {
  if (item.mediaType === "album" && item.mbid) return `${prefix}-album-${item.mbid}`;
  if (item.mediaType === "book" && item.volumeId) return `${prefix}-book-${item.volumeId}`;
  return `${prefix}-${item.mediaType}-${item.tmdbId}`;
};
