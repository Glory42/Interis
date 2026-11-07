import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Ellipsis } from "lucide-react";
import { RocketDisplay } from "@/components/film/rating/RocketDisplay";
import { LogEditor } from "@/features/media/log-editor/LogEditor";
import { PHONE_QUERY, useMediaQuery } from "@/lib/use-media-query";
import { DiaryMediaLink } from "./DiaryMediaLink";
import { DiaryPosterCell } from "./DiaryPosterCell";
import type { DiaryRow as DiaryRowModel } from "./diary-model";

type DiaryRowProps = {
  row: DiaryRowModel;
  username: string;
  // The viewer's own diary: each row can be edited or deleted.
  isOwner?: boolean;
};

// One log line: the day (first row of the day only), poster, title, rockets and ♥ ↻ ✎.
export const DiaryRow = ({ row, username, isOwner = false }: DiaryRowProps) => {
  const [isEditing, setIsEditing] = useState(false);
  // Ten rockets don't fit beside the title on a phone; one rocket and the score do.
  const isPhone = useMediaQuery(PHONE_QUERY);
  const canEdit = isOwner && row.tmdbId !== null;
  const isSeries = row.channel === "serial";
  const kicker = [isSeries ? "Series" : "Film", row.rewatch ? "rewatch" : null].filter(Boolean).join(" · ");

  return (
    <div className="flex items-center gap-3 border-b border-[color:var(--line)] py-2.5">
      <div className="w-9 shrink-0 text-center sm:w-11">
        {row.dayLabel ? (
          <>
            <b className="display-3 block leading-none text-foreground">{row.dayLabel.day}</b>
            <span className="mono-meta text-[9px] text-muted-foreground">{row.dayLabel.weekday}</span>
          </>
        ) : null}
      </div>
      <DiaryMediaLink row={row} className="w-10 shrink-0">
        <DiaryPosterCell title={row.title} posterPath={row.posterPath} />
      </DiaryMediaLink>
      <div className="min-w-0 flex-1">
        <DiaryMediaLink row={row} className="block truncate text-sm font-semibold text-foreground hover:underline">
          {row.title}
          {row.releaseYear ? <span className="mono-meta ml-1.5 font-normal text-muted-foreground">{row.releaseYear}</span> : null}
        </DiaryMediaLink>
        <p className={`kicker text-[9px] ${isSeries ? "text-[color:var(--series)]" : "text-[color:var(--film)]"}`}>{kicker}</p>
      </div>
      {row.rating !== null ? <RocketDisplay rating={row.rating} size="sm" variant={isPhone ? "compact" : "row"} /> : null}
      <span className="flex w-14 shrink-0 items-center justify-end gap-1.5 text-sm">
        {row.isLiked ? <span aria-label="Liked" className="text-[color:var(--like)]">♥</span> : null}
        {row.rewatch ? <span aria-label="Rewatch" className="text-primary">↻</span> : null}
        {row.reviewId ? (
          <Link
            to="/reviews/$username/$reviewId"
            params={{ username, reviewId: row.reviewId }}
            aria-label="Review"
            className="text-primary"
            viewTransition
          >
            ✎
          </Link>
        ) : null}
      </span>
      {canEdit ? (
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="flex size-8 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground"
          aria-label={`Edit log of ${row.title}`}
        >
          <Ellipsis aria-hidden className="size-4" />
        </button>
      ) : null}
      {canEdit && row.tmdbId !== null ? (
        <LogEditor
          isOpen={isEditing}
          onClose={() => setIsEditing(false)}
          subject={{
            type: "existing",
            kind: isSeries ? "tv" : "film",
            tmdbId: row.tmdbId,
            title: row.title,
            year: row.releaseYear,
            posterPath: row.posterPath,
            logId: row.id,
            watchedDate: row.createdAt,
            rating: row.rating,
            rewatch: row.rewatch,
            review: null,
          }}
        />
      ) : null}
    </div>
  );
};
