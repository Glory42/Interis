import { createFileRoute } from "@tanstack/react-router";
import { ProfileWatchlistPage } from "@/features/profile/pages/ProfileWatchlistPage";

export const Route = createFileRoute("/profile/$username/watchlist")({
  component: ProfileWatchlistRoute,
});

function ProfileWatchlistRoute() {
  const { username } = Route.useParams();

  return <ProfileWatchlistPage username={username} />;
}
