import { createFileRoute } from "@tanstack/react-router";
import { ProfileReviewsPage } from "@/features/profile/pages/ProfileReviewsPage";

export const Route = createFileRoute("/profile/$username/reviews")({
  component: ProfileReviewsRoute,
});

function ProfileReviewsRoute() {
  const { username } = Route.useParams();

  return <ProfileReviewsPage username={username} />;
}
