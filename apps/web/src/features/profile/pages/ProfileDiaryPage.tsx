import { LoadingRegion } from "@/components/ui/PageSkeletons";
import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ProfileTabEmptyState } from "@/features/profile/components/ProfileTabEmptyState";
import { DiaryRow } from "@/features/profile/components/diary/DiaryRow";
import { DiaryRowSkeleton } from "@/features/profile/components/diary/DiaryRowSkeleton";
import { DiaryTagsOverview } from "@/features/profile/components/diary/DiaryTagsOverview";
import { toDiaryMonths, toDiaryRows } from "@/features/profile/components/diary/diary-model";
import { useUserDiary } from "@/features/profile/hooks/useProfile";

type ProfileDiaryPageProps = {
  username: string;
  // Shows only the logs carrying this Diary Tag.
  tag?: string;
};

export const ProfileDiaryPage = ({ username, tag }: ProfileDiaryPageProps) => {
  const { user } = useAuth();
  const isOwner = Boolean(user) && user?.username.toLowerCase() === username.toLowerCase();
  const diaryQuery = useUserDiary(username, tag);
  const rows = useMemo(() => toDiaryRows(diaryQuery.data?.pages.flat() ?? []), [diaryQuery.data]);
  const months = useMemo(() => toDiaryMonths(rows, Boolean(diaryQuery.hasNextPage)), [rows, diaryQuery.hasNextPage]);

  return (
    <>
      <DiaryTagsOverview username={username} activeTag={tag} />

      {tag ? (
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="body-s text-muted-foreground">
            Logs tagged <span className="text-foreground">#{tag}</span>
          </p>
          <Link
            to="/profile/$username/diary"
            params={{ username }}
            search={{}}
            className="mono-meta uppercase text-muted-foreground hover:text-foreground"
          >
            Show all
          </Link>
        </div>
      ) : null}

      {diaryQuery.isPending ? (
        <LoadingRegion label="Loading diary">
          {Array.from({ length: 6 }, (_, index) => (
            <DiaryRowSkeleton key={index} />
          ))}
        </LoadingRegion>
      ) : null}

      {diaryQuery.isError ? (
        <div className=" border border-border/60 bg-card/30 p-4 text-sm text-destructive">
          Could not load diary entries.
        </div>
      ) : null}

      {!diaryQuery.isPending && !diaryQuery.isError && rows.length === 0 && tag ? (
        <p className="body-s py-6 text-center text-muted-foreground">{`Nothing logged with #${tag}.`}</p>
      ) : null}

      {!diaryQuery.isPending && !diaryQuery.isError && rows.length === 0 && !tag ? (
        <ProfileTabEmptyState
          isOwner={isOwner}
          visitorText={`${username} hasn't logged anything yet.`}
          ownerAction={{ label: "✎ Log a watch", to: "/movies" }}
          ownerText="Your favourites, diary and stats fill in from what you log."
        />
      ) : null}

      {months.map((month) => (
        <section key={month.key} aria-label={month.label} className="mb-4">
          <div className="slate mono-meta uppercase">
            <span>{month.label}</span>
            {month.count !== null ? <span>{`${month.count} logged`}</span> : null}
          </div>
          {month.rows.map((row) => (
            <DiaryRow key={row.id} row={row} username={username} isOwner={isOwner} />
          ))}
        </section>
      ))}

      {diaryQuery.hasNextPage ? (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            disabled={diaryQuery.isFetchingNextPage}
            onClick={() => { void diaryQuery.fetchNextPage(); }}
            className="mono-meta rounded-[3px] border border-[color:var(--line)] px-4 py-2 uppercase text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            {diaryQuery.isFetchingNextPage ? "Loading…" : "Load older"}
          </button>
        </div>
      ) : null}
    </>
  );
};
