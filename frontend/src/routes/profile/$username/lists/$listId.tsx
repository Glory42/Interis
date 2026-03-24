import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { ProfileShell } from "@/features/profile/components/ProfileShell";

export const Route = createFileRoute("/profile/$username/lists/$listId")({
  component: ProfileListDetailPage,
});

function ProfileListDetailPage() {
  const { username, listId } = Route.useParams();

  return (
    <ProfileShell username={username} activeTab="lists">
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">
          List detail view for <span className="font-semibold">{listId}</span> is
          planned for Phase 3.
        </CardContent>
      </Card>
    </ProfileShell>
  );
}
