import { createFileRoute } from "@tanstack/react-router";
import { ProfileDiaryPage } from "@/features/profile/pages/ProfileDiaryPage";

export const Route = createFileRoute("/profile/$username/diary")({
  component: ProfileDiaryRoute,
});

function ProfileDiaryRoute() {
  const { username } = Route.useParams();

  return <ProfileDiaryPage username={username} />;
}
