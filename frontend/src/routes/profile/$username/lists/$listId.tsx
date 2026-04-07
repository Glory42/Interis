import { createFileRoute } from "@tanstack/react-router";
import { ProfileListDetailPage } from "@/features/profile/pages/ProfileListDetailPage";

export const Route = createFileRoute("/profile/$username/lists/$listId")({
  component: ProfileListDetailRoute,
});

function ProfileListDetailRoute() {
  const { listId } = Route.useParams();

  return <ProfileListDetailPage listId={listId} />;
}
