import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { DiaryEntryItem } from "@/features/diary/components/DiaryEntry";
import { ProfileShell } from "@/features/profile/components/ProfileShell";
import { useUserDiary } from "@/features/profile/hooks/useProfile";

export const Route = createFileRoute("/profile/$username/diary")({
  component: ProfileDiaryPage,
});

function ProfileDiaryPage() {
  const { username } = Route.useParams();
  const diaryQuery = useUserDiary(username);

  return (
    <ProfileShell username={username} activeTab="diary">
      {diaryQuery.isPending ? (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Loading diary...
          </CardContent>
        </Card>
      ) : null}

      {diaryQuery.isError ? (
        <Card>
          <CardContent className="p-4 text-sm text-destructive">
            Could not load diary entries.
          </CardContent>
        </Card>
      ) : null}

      {!diaryQuery.isPending && !diaryQuery.isError && (diaryQuery.data?.length ?? 0) === 0 ? (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            No diary entries yet.
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-3">
        {diaryQuery.data?.map((entry) => <DiaryEntryItem key={entry.id} entry={entry} />)}
      </div>
    </ProfileShell>
  );
}
