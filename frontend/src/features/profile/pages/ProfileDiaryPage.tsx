import { BookOpen } from "lucide-react";
import { DiaryEntryItem } from "@/features/diary/components/DiaryEntry";
import { ProfileTabEmptyState } from "@/features/profile/components/ProfileTabEmptyState";
import { useUserDiary } from "@/features/profile/hooks/useProfile";

type ProfileDiaryPageProps = {
  username: string;
};

export const ProfileDiaryPage = ({ username }: ProfileDiaryPageProps) => {
  const diaryQuery = useUserDiary(username);

  return (
    <>
      {diaryQuery.isPending ? (
        <div className=" border border-border/60 bg-card/30 p-4 text-sm text-muted-foreground">
          Loading diary...
        </div>
      ) : null}

      {diaryQuery.isError ? (
        <div className=" border border-border/60 bg-card/30 p-4 text-sm text-destructive">
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
        {diaryQuery.data?.map((entry) => (
          <DiaryEntryItem key={entry.id} entry={entry} />
        ))}
      </div>
    </>
  );
};
