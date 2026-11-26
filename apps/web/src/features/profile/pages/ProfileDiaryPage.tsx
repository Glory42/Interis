import { LoadingRegion } from "@/components/ui/PageSkeletons";
import { useMemo, useState } from "react";
import { SentenceSelect } from "@/components/ui/SentenceSelect";
import { ProfileTabEmptyState } from "@/features/profile/components/ProfileTabEmptyState";
import { DiaryRow } from "@/features/profile/components/diary/DiaryRow";
import { DiaryRowSkeleton } from "@/features/profile/components/diary/DiaryRowSkeleton";
import { toDiaryMonths, toDiaryRows } from "@/features/profile/components/diary/diary-model";
import {
  mediaShelfOptions,
  toMediaShelfType,
  type MediaShelfFilter,
} from "@/features/profile/components/media-shelf-filter";
import { useIsOwnProfile, useUserDiary, useUserProfile } from "@/features/profile/hooks/useProfile";

type ProfileDiaryPageProps = {
  username: string;
};

export const ProfileDiaryPage = ({ username }: ProfileDiaryPageProps) => {
  const [filter, setFilter] = useState<MediaShelfFilter>("all");
  const isOwner = useIsOwnProfile(username);
  const diaryQuery = useUserDiary(username);
  const stats = useUserProfile(username).data?.stats;
  const items = useMemo(() => diaryQuery.data?.pages.flat() ?? [], [diaryQuery.data]);

  const filteredItems = useMemo(() => {
    if (filter === "all") return items;
    const mediaType = toMediaShelfType(filter);
    return items.filter((item) => item.mediaType === mediaType);
  }, [items, filter]);

  const itemCount =
    filter === "movie"
      ? (stats?.movieEntryCount ?? filteredItems.length)
      : filter === "serial"
        ? (stats?.serialEntryCount ?? filteredItems.length)
        : stats
          ? stats.movieEntryCount + (stats.serialEntryCount ?? 0)
          : filteredItems.length;

  const rows = useMemo(() => toDiaryRows(filteredItems), [filteredItems]);
  const months = useMemo(() => toDiaryMonths(rows, Boolean(diaryQuery.hasNextPage)), [rows, diaryQuery.hasNextPage]);

  return (
    <>
      {!diaryQuery.isPending && !diaryQuery.isError && items.length > 0 ? (
        <p className="body-s mb-4 text-muted-foreground">
          {filter === "all"
            ? `Showing all ${itemCount.toLocaleString("en-US")} logs`
            : `Showing ${itemCount.toLocaleString("en-US")} logs`}
          {" · "}
          <SentenceSelect
            value={filter}
            options={mediaShelfOptions()}
            onChange={setFilter}
            ariaLabel="Filter diary by media type"
          />
          {"."}
        </p>
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

      {!diaryQuery.isPending && !diaryQuery.isError && items.length === 0 ? (
        <ProfileTabEmptyState
          isOwner={isOwner}
          visitorText={`${username} hasn't logged anything yet.`}
          ownerAction={{ label: "✎ Log a watch", to: "/movies" }}
          ownerText="Your favourites, diary and stats fill in from what you log."
        />
      ) : null}

      {!diaryQuery.isPending && !diaryQuery.isError && items.length > 0 && rows.length === 0 ? (
        <p className="body-s py-6 text-center text-muted-foreground">
          {`No ${filter === "movie" ? "films" : "series"} in the loaded diary yet.`}
        </p>
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
