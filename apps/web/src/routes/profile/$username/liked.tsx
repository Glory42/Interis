import { createFileRoute } from "@tanstack/react-router";
import { ProfileLikedPage } from "@/features/profile/pages/ProfileLikedPage";

export const Route = createFileRoute("/profile/$username/liked")({
  component: ProfileLikedRoute,
});

function ProfileLikedRoute() {
  const { username } = Route.useParams();

  return <ProfileLikedPage username={username} />;
}
