import { createFileRoute } from "@tanstack/react-router";
import { ProfileCinemaPage } from "@/features/profile/pages/ProfileCinemaPage";

export const Route = createFileRoute("/profile/$username/cinema")({
  component: ProfileCinemaRoute,
});

function ProfileCinemaRoute() {
  const { username } = Route.useParams();

  return <ProfileCinemaPage username={username} />;
}
