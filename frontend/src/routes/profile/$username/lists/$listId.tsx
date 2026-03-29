import { createFileRoute } from "@tanstack/react-router";
import { Layers3 } from "lucide-react";
import { ProfileTabEmptyState } from "@/features/profile/components/ProfileTabEmptyState";
import { ProfileLayout } from "@/features/profile/layout/ProfileLayout";

export const Route = createFileRoute("/profile/$username/lists/$listId")({
  component: ProfileListDetailPage,
});

function ProfileListDetailPage() {
  const { username, listId } = Route.useParams();

  return (
    <ProfileLayout username={username} activeTab="lists">
      <ProfileTabEmptyState
        icon={Layers3}
        title="List details are unavailable"
        description={`Public list detail for ${listId} is not available yet.`}
      />
    </ProfileLayout>
  );
}
