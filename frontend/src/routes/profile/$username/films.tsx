import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { ProfileShell } from "@/features/profile/components/ProfileShell";

export const Route = createFileRoute("/profile/$username/films")({
  component: ProfileFilmsPage,
});

function ProfileFilmsPage() {
  const { username } = Route.useParams();

  return (
    <ProfileShell username={username} activeTab="films">
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">
          Films grid view is planned for the social/interaction phase.
        </CardContent>
      </Card>
    </ProfileShell>
  );
}
