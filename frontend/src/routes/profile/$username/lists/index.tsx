import { createFileRoute } from "@tanstack/react-router";
import { ProfileShell } from "@/features/profile/components/ProfileShell";
import { ListCard } from "@/features/lists/components/ListCard";

export const Route = createFileRoute("/profile/$username/lists/")({
  component: ProfileListsPage,
});

function ProfileListsPage() {
  const { username } = Route.useParams();

  return (
    <ProfileShell username={username} activeTab="lists">
      <ListCard />
    </ProfileShell>
  );
}
