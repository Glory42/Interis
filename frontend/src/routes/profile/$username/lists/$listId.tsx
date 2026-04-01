import { createFileRoute } from "@tanstack/react-router";
import { Layers3 } from "lucide-react";
import { ProfileTabEmptyState } from "@/features/profile/components/ProfileTabEmptyState";

export const Route = createFileRoute("/profile/$username/lists/$listId")({
  component: ProfileListDetailPage,
});

function ProfileListDetailPage() {
  const { listId } = Route.useParams();

  return (
    <ProfileTabEmptyState
      icon={Layers3}
      title="List details are unavailable"
      description={`Public list detail for ${listId} is not available yet.`}
    />
  );
}
