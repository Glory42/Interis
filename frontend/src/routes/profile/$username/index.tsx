import { createFileRoute } from "@tanstack/react-router";
import { ProfileOverviewContent } from "@/features/profile/components/overview/ProfileOverviewContent";
import { ProfileLayout } from "@/features/profile/layout/ProfileLayout";

export const Route = createFileRoute("/profile/$username/")({
  component: ProfileOverviewPage,
});

function ProfileOverviewPage() {
  const { username } = Route.useParams();

  return (
    <ProfileLayout username={username} activeTab="overview">
      <ProfileOverviewContent username={username} />
    </ProfileLayout>
  );
}
