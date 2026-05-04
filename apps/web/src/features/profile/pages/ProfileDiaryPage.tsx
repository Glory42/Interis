import { useMemo } from "react";
import { BookOpen } from "lucide-react";
import { ProfileTabEmptyState } from "@/features/profile/components/ProfileTabEmptyState";
import { DiaryRow } from "@/features/profile/components/diary/DiaryRow";
import { DiaryTableHeader } from "@/features/profile/components/diary/DiaryTableHeader";
import { toDiaryRows } from "@/features/profile/components/diary/diary-model";
import { useUserLikedFilms, useUserRecentActivity } from "@/features/profile/hooks/useProfile";

type ProfileDiaryPageProps = {
  username: string;
};

export const ProfileDiaryPage = ({ username }: ProfileDiaryPageProps) => {
  const activityQuery = useUserRecentActivity(username, 120);
  const likedQuery = useUserLikedFilms(username);

  const likedTmdbIdSet = useMemo(() => {
    return new Set(
      (likedQuery.data ?? [])
        .filter((item) => item.mediaType === "movie")
        .map((movie) => movie.tmdbId),
    );
  }, [likedQuery.data]);

  const rows = useMemo(() => {
    return toDiaryRows(activityQuery.data ?? [], likedTmdbIdSet);
  }, [activityQuery.data, likedTmdbIdSet]);

  return (
    <>
      {activityQuery.isPending ? (
        <div className=" border border-border/60 bg-card/30 p-4 text-sm text-muted-foreground">
          Loading diary...
        </div>
      ) : null}

      {activityQuery.isError ? (
        <div className=" border border-border/60 bg-card/30 p-4 text-sm text-destructive">
          Could not load diary entries.
        </div>
      ) : null}

      {!activityQuery.isPending && !activityQuery.isError && rows.length === 0 ? (
        <ProfileTabEmptyState
          icon={BookOpen}
          title="No diary activity yet"
          description="This profile has not logged or reviewed anything yet."
        />
      ) : null}

      <div className="space-y-0">
        <DiaryTableHeader />
        {rows.map((row) => (
          <DiaryRow key={row.id} row={row} username={username} />
        ))}
      </div>
    </>
  );
};
