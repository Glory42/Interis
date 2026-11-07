import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { authKeys } from "@/features/auth/hooks/useAuth";
import { invalidateFollowingFeed, patchFeed } from "@/features/feed/hooks/feed-cache";
import { filmKeys } from "@/features/films/hooks/useFilms";
import { profileKeys } from "@/features/profile/hooks/useProfile";
import { deleteReview, type ReviewDetail } from "@/features/reviews/api";

type DeletableReview = { id: string; mediaType: ReviewDetail["mediaType"]; tmdbId: number };
import { seriesKeys } from "@/features/tv/hooks/tv/query-keys";
import type { MeProfile } from "@/types/api";

// Deletes one of the viewer's own reviews. The review's own detail query is
// left alone: the page showing it navigates away instead of refetching a 404.
export const useDeleteReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (review: DeletableReview) => deleteReview(review.id),
    onSuccess: async (_data, { id, mediaType, tmdbId }) => {
      await patchFeed(queryClient, { review: id }, { type: "review-deleted" });
      const me = queryClient.getQueryData<MeProfile | null>(authKeys.me);
      const keys: QueryKey[] = [
        ["reviews", "mine"],
        ...(mediaType === "movie"
          ? [filmKeys.logs(tmdbId), filmKeys.detailViewRoot(tmdbId)]
          : [seriesKeys.logs(tmdbId), seriesKeys.detailViewRoot(tmdbId)]),
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
