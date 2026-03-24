import { createFileRoute } from "@tanstack/react-router";
import { ProfileShell } from "@/features/profile/components/ProfileShell";
import { ReviewCard } from "@/features/reviews/components/ReviewCard";

export const Route = createFileRoute("/profile/$username/reviews")({
  component: ProfileReviewsPage,
});

function ProfileReviewsPage() {
  const { username } = Route.useParams();

  return (
    <ProfileShell username={username} activeTab="reviews">
      <ReviewCard />
    </ProfileShell>
  );
}
