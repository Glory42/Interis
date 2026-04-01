import { createFileRoute } from "@tanstack/react-router";
import { ProfileOverviewContent } from "@/features/profile/components/overview/ProfileOverviewContent";

export const Route = createFileRoute("/profile/$username/")({
  component: ProfileOverviewPage,
});

function ProfileOverviewPage() {
  const { username } = Route.useParams();

  return <ProfileOverviewContent username={username} />;
}
