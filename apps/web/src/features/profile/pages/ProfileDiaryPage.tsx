import { useMemo } from "react";
import { BookOpen } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ProfileTabEmptyState } from "@/features/profile/components/ProfileTabEmptyState";
import { DiaryRow } from "@/features/profile/components/diary/DiaryRow";
import { DiaryRowSkeleton } from "@/features/profile/components/diary/DiaryRowSkeleton";
import { DiaryTableHeader } from "@/features/profile/components/diary/DiaryTableHeader";
import { toDiaryRows } from "@/features/profile/components/diary/diary-model";
import { useUserDiary } from "@/features/profile/hooks/useProfile";

type ProfileDiaryPageProps = {
  username: string;
};

export const ProfileDiaryPage = ({ username }: ProfileDiaryPageProps) => {
  const { user } = useAuth();
  const isOwner = Boolean(user) && user?.username.toLowerCase() === username.toLowerCase();
  const diaryQuery = useUserDiary(username);
  const rows = useMemo(() => {
    return toDiaryRows(diaryQuery.data?.pages.flat() ?? []);
  }, [diaryQuery.data]);

  return (
    <>
      {diaryQuery.isPending ? (
        <div className="space-y-0">
          <DiaryTableHeader />
          {Array.from({ length: 6 }).map((_, index) => (
            <DiaryRowSkeleton key={`diary-row-skeleton-${index}`} />
          ))}
        </div>
      ) : null}

      {diaryQuery.isError ? (
        <div className=" border border-border/60 bg-card/30 p-4 text-sm text-destructive">
          Could not load diary entries.
        </div>
      ) : null}

      {!diaryQuery.isPending && !diaryQuery.isError && rows.length === 0 ? (
        <ProfileTabEmptyState
          icon={BookOpen}
          title="No diary activity yet"
          description="This profile has not logged or reviewed anything yet."
          cta={{ label: "Browse Movie", to: "/movies" }}
        />
      ) : null}

      {rows.length > 0 ? (
        <div className="space-y-0">
          <DiaryTableHeader isOwner={isOwner} />
          {rows.map((row) => (
            <DiaryRow key={row.id} row={row} username={username} isOwner={isOwner} />
          ))}
        </div>
      ) : null}

      {diaryQuery.hasNextPage ? (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            disabled={diaryQuery.isFetchingNextPage}
            onClick={() => { void diaryQuery.fetchNextPage(); }}
            className="rounded-full border border-border/70 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            {diaryQuery.isFetchingNextPage ? "Loading..." : "Load more"}
          </button>
        </div>
      ) : null}
    </>
  );
};
