import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { authKeys } from "@/features/auth/hooks/useAuth";
import { invalidateFollowingFeed } from "@/features/feed/hooks/feed-cache.helper";
import { movieKeys } from "@/features/movies/hooks/useMovies";
import { profileKeys } from "@/features/profile/hooks/useProfile";
import { deleteReview, type ReviewDetail } from "@/features/reviews/api";

type DeletableReview = { id: string; mediaType: ReviewDetail["mediaType"]; tmdbId: number };
import { serialKeys } from "@/features/serials/hooks/serials/query-keys";
import type { MeProfile } from "@/types/api";

// Deletes one of the viewer's own reviews. The review's own detail query is
// left alone: the page showing it navigates away instead of refetching a 404.
export const useDeleteReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (review: DeletableReview) => deleteReview(review.id),
    onSuccess: async (_data, { mediaType, tmdbId }) => {
      const me = queryClient.getQueryData<MeProfile | null>(authKeys.me);
      const keys: QueryKey[] = [
        ["reviews", "mine"],
        ...(mediaType === "movie"
          ? [movieKeys.logs(tmdbId), movieKeys.detailViewRoot(tmdbId)]
          : [serialKeys.logs(tmdbId), serialKeys.detailViewRoot(tmdbId)]),
      ];

      if (me?.username) {
        keys.push(
          profileKeys.reviews(me.username),
          profileKeys.diary(me.username),
          profileKeys.detail(me.username),
          profileKeys.recentActivity(me.username, 20),
        );
      }

      await Promise.all([
        ...keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
        invalidateFollowingFeed(queryClient),
      ]);
    },
  });
};
