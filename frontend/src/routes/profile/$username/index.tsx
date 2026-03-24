import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { RecentActivity } from "@/features/profile/components/RecentActivity";
import { ProfileShell } from "@/features/profile/components/ProfileShell";
import { Top4Films } from "@/features/profile/components/Top4Films";
import { useUserProfile } from "@/features/profile/hooks/useProfile";

export const Route = createFileRoute("/profile/$username/")({
  component: ProfileOverviewPage,
});

function ProfileOverviewPage() {
  const { username } = Route.useParams();
  const profileQuery = useUserProfile(username);

  return (
    <ProfileShell username={username} activeTab="overview">
      {profileQuery.data ? (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <Top4Films movieIds={profileQuery.data.top4MovieIds ?? []} />
          <RecentActivity />
        </div>
      ) : (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Loading overview...
          </CardContent>
        </Card>
      )}
    </ProfileShell>
  );
}
