import { useMutation, useQueryClient } from "@tanstack/react-query";
import { patchFeed } from "@/features/feed/hooks/feed-cache";
import { refreshAfter, toMediaKind } from "@/features/media/media-cache";
import { deleteReview, type ReviewDetail } from "@/features/reviews/api";

type DeletableReview = { id: string; mediaType: ReviewDetail["mediaType"]; tmdbId: number };

// Deletes one of the viewer's own reviews. The review's own detail query is
// left alone: the page showing it navigates away instead of refetching a 404.
export const useDeleteReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (review: DeletableReview) => deleteReview(review.id),
    onSuccess: async (_data, { id, mediaType, tmdbId }) => {
      await patchFeed(queryClient, { review: id }, { type: "review-deleted" });
      await refreshAfter(queryClient, { type: "review-deleted", kind: toMediaKind(mediaType), tmdbId });
    },
  });
};
