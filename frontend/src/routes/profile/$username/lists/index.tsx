import { createFileRoute } from "@tanstack/react-router";
import { ProfileListsPage } from "@/features/profile/pages/ProfileListsPage";

export const Route = createFileRoute("/profile/$username/lists/")({
  component: ProfileListsRoute,
});

function ProfileListsRoute() {
  const { username } = Route.useParams();

  return <ProfileListsPage username={username} />;
}
