import { memo } from "react";
import { Link } from "@tanstack/react-router";
import type { LikedList } from "@/features/profile/api";
import { formatRelativeTime } from "@/lib/time";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";
const getSmallPosterUrl = (posterPath: string | null) =>
  posterPath ? `${TMDB_IMAGE_BASE}/w92${posterPath}` : "";

const OFFSET = 40;
const POSTER_W = 48;
const POSTER_H = 70;
const CONTAINER_W = POSTER_W + OFFSET * 3;

export const LikedListCard = memo(function LikedListCard({ list }: { list: LikedList }) {
  const covers = list.coverImages.slice(0, 4);
  const derivedTypeLabel =
    list.derivedType === "cinema"
      ? "CINEMA"
      : list.derivedType === "serial"
        ? "SERIAL"
        : list.derivedType === "mixed"
          ? "MIXED"
          : null;

  return (
    <Link
      to="/profile/$username/lists/$listId"
      params={{ username: list.ownerUsername, listId: list.id }}
      className="group flex items-center gap-5 border-b border-border/50 py-5 transition-opacity last:border-0 hover:opacity-90"
    >
      <div
        className="relative shrink-0"
        style={{ width: `${CONTAINER_W}px`, height: `${POSTER_H}px` }}
      >
        {Array.from({ length: 4 }).map((_, i) => {
          const cover = covers[i];
          const posterUrl = cover ? getSmallPosterUrl(cover.posterPath) : "";
          return (
            <div
              key={i}
              className="absolute top-0 overflow-hidden rounded-md border border-border/40 bg-muted/20"
              style={{
                left: `${i * OFFSET}px`,
                width: `${POSTER_W}px`,
                height: `${POSTER_H}px`,
                zIndex: 4 - i,
                boxShadow: i > 0 ? "-2px 0 4px rgba(0,0,0,0.25)" : undefined,
              }}
            >
              {posterUrl ? (
                <img src={posterUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="min-w-0 flex-1">
        <p className="mb-0.5 font-mono text-[10px] text-muted-foreground">
          by{" "}
          <span className="profile-shell-accent">
            {list.ownerDisplayUsername ?? list.ownerUsername}
          </span>
        </p>
        <h3 className="mb-1 font-mono text-base font-semibold text-foreground group-hover:text-foreground/90">
          {list.title}
        </h3>
        {list.description ? (
          <p className="mb-2 line-clamp-1 font-mono text-xs text-muted-foreground">
            {list.description}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] font-semibold profile-shell-accent">
            {list.itemCount}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">items</span>
          <span className="font-mono text-[11px] text-muted-foreground">·</span>
          <span className="font-mono text-[11px] text-muted-foreground">
            liked {formatRelativeTime(list.likedAt)}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5 pt-0.5">
        {derivedTypeLabel ? (
          <span className="rounded-full border border-border/60 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
            {derivedTypeLabel}
          </span>
        ) : null}
        {list.isRanked ? (
          <span className="rounded-full border border-border/60 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
            RANKED
          </span>
        ) : null}
      </div>
    </Link>
  );
});
