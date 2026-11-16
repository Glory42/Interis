import { type QueryClient, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { MediaKind } from "@/features/media/media-cache";
import { getMediaFollowing } from "@/features/media/following/api";

export const mediaFollowingKeys = {
  all: ["media-following"] as const,
  title: (kind: MediaKind, tmdbId: number) => ["media-following", kind, tmdbId] as const,
};

// What the people the viewer follows think of one Film or Series. Signed out, never fetched.
export const useMediaFollowing = (kind: MediaKind, tmdbId: number, enabled = true) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: mediaFollowingKeys.title(kind, tmdbId),
    queryFn: ({ signal }) => getMediaFollowing(kind, tmdbId, { signal }),
    enabled: enabled && Boolean(user),
  });
};

// Following, blocking or muting someone can change any title's list. Only
// mounted panels refetch; the rest are just marked stale.
export const invalidateMediaFollowing = (queryClient: QueryClient) =>
  queryClient.invalidateQueries({ queryKey: mediaFollowingKeys.all });
