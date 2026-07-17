import { createFileRoute } from "@tanstack/react-router";
import { ProfileStatsPage } from "@/features/profile/pages/ProfileStatsPage";

export const Route = createFileRoute("/profile/$username/stats")({
  component: ProfileStatsRoute,
});

function ProfileStatsRoute() {
  const { username } = Route.useParams();

  return <ProfileStatsPage username={username} />;
}
