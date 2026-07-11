import { createFileRoute } from "@tanstack/react-router";
import { ProfileWatchingPage } from "@/features/profile/pages/ProfileWatchingPage";

export const Route = createFileRoute("/profile/$username/watching")({
  component: ProfileWatchingRoute,
});

function ProfileWatchingRoute() {
  const { username } = Route.useParams();

  return <ProfileWatchingPage username={username} />;
}
