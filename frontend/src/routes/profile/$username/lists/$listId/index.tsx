import { createFileRoute } from "@tanstack/react-router";
import { ProfileListDetailPage } from "@/features/profile/pages/ProfileListDetailPage";

export const Route = createFileRoute("/profile/$username/lists/$listId/")({
  component: ProfileListDetailRoute,
});

function ProfileListDetailRoute() {
  const { username, listId } = Route.useParams();

  return <ProfileListDetailPage username={username} listId={listId} />;
}
