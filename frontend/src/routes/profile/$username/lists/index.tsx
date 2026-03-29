import { createFileRoute } from "@tanstack/react-router";
import { Layers3 } from "lucide-react";
import { ProfileTabEmptyState } from "@/features/profile/components/ProfileTabEmptyState";
import { ProfileLayout } from "@/features/profile/layout/ProfileLayout";

export const Route = createFileRoute("/profile/$username/lists/")({
  component: ProfileListsPage,
});

function ProfileListsPage() {
  const { username } = Route.useParams();

  return (
    <ProfileLayout username={username} activeTab="lists">
      {(profile) => {
        const listCount = profile.stats?.listCount ?? 0;

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
      }}
    </ProfileLayout>
  );
}
