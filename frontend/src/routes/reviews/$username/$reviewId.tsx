import { createFileRoute } from "@tanstack/react-router";
import { ProfileReviewDetailPage } from "@/features/reviews/components/ProfileReviewDetailPage";

export const Route = createFileRoute("/reviews/$username/$reviewId")({
  component: ReviewDetailRoute,
});

function ReviewDetailRoute() {
  const { username, reviewId } = Route.useParams();

  return <ProfileReviewDetailPage username={username} reviewId={reviewId} />;
}
