import { createFileRoute } from "@tanstack/react-router";
import { getProfileReviewDetail } from "@/features/reviews/api";
import { ProfileReviewDetailPage } from "@/features/reviews/components/ProfileReviewDetailPage";
import { reviewKeys } from "@/features/reviews/hooks/useReviews";

export const Route = createFileRoute("/reviews/$username/$reviewId")({
  loader: async ({ context, params }) => {
    if (params.username.trim().length === 0 || params.reviewId.trim().length === 0) {
      return;
    }

    await context.queryClient.prefetchQuery({
      queryKey: reviewKeys.detail(params.username, params.reviewId),
      queryFn: ({ signal }) =>
        getProfileReviewDetail(params.username, params.reviewId, { signal }),
    });
  },
  component: ReviewDetailRoute,
});

function ReviewDetailRoute() {
  const { username, reviewId } = Route.useParams();

  return <ProfileReviewDetailPage username={username} reviewId={reviewId} />;
}
