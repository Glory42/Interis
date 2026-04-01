import { createFileRoute } from "@tanstack/react-router";
import { Layers3 } from "lucide-react";
import { ProfileTabEmptyState } from "@/features/profile/components/ProfileTabEmptyState";
import { useUserProfile } from "@/features/profile/hooks/useProfile";

export const Route = createFileRoute("/profile/$username/lists/")({
  component: ProfileListsPage,
});

function ProfileListsPage() {
  const { username } = Route.useParams();
  const profileQuery = useUserProfile(username);

  if (profileQuery.isPending) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card/30 p-4 text-sm text-muted-foreground">
        Loading profile...
      </div>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card/30 p-4 text-sm text-destructive">
        Could not load profile lists.
      </div>
    );
  }

  const listCount = profileQuery.data.stats?.listCount ?? 0;

  if (listCount === 0) {
    return (
      <ProfileTabEmptyState
        icon={Layers3}
        title="No lists yet"
        description="This profile has not created any public lists yet."
      />
    );
  }

  return (
    <ProfileTabEmptyState
      icon={Layers3}
      title="Lists are not exposed yet"
      description="This profile has lists, but public list browsing endpoints are not available yet."
    />
  );
}
