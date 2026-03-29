import { createFileRoute } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { DiaryEntryItem } from "@/features/diary/components/DiaryEntry";
import { ProfileTabEmptyState } from "@/features/profile/components/ProfileTabEmptyState";
import { useUserDiary } from "@/features/profile/hooks/useProfile";
import { ProfileLayout } from "@/features/profile/layout/ProfileLayout";

export const Route = createFileRoute("/profile/$username/diary")({
  component: ProfileDiaryPage,
});

function ProfileDiaryPage() {
  const { username } = Route.useParams();
  const diaryQuery = useUserDiary(username);

  return (
    <ProfileLayout username={username} activeTab="diary">
      {diaryQuery.isPending ? (
        <div className="rounded-2xl border border-border/60 bg-card/30 p-4 text-sm text-muted-foreground">
          Loading diary...
        </div>
      ) : null}

      {diaryQuery.isError ? (
        <div className="rounded-2xl border border-border/60 bg-card/30 p-4 text-sm text-destructive">
          Could not load diary entries.
        </div>
      ) : null}

      {!diaryQuery.isPending && !diaryQuery.isError && (diaryQuery.data?.length ?? 0) === 0 ? (
        <ProfileTabEmptyState
          icon={BookOpen}
          title="No diary entries yet"
          description="Start logging your viewing journey."
        />
      ) : null}

      <div className="space-y-4">
        {diaryQuery.data?.map((entry) => <DiaryEntryItem key={entry.id} entry={entry} />)}
      </div>
    </ProfileLayout>
  );
}
