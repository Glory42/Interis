import { Link } from "@tanstack/react-router";
import { formatRelativeTime } from "@/lib/time";
import type { ListSummary } from "@/features/lists/api";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

const getPosterUrl = (posterPath: string | null): string => {
  if (!posterPath) return "";
  return `${TMDB_IMAGE_BASE}/w92${posterPath}`;
};

type ListCardProps = {
  list: ListSummary;
  username: string;
};

export const ListCard = ({ list, username }: ListCardProps) => {
  const covers = list.coverImages.slice(0, 4);
  const coverCount = covers.filter((c) => c.posterPath).length;

  const derivedTypeLabel =
    list.derivedType === "cinema"
      ? "CINEMA"
      : list.derivedType === "serial"
        ? "SERIAL"
        : list.derivedType === "mixed"
          ? "MIXED"
          : null;

  // Stacked: each poster offset, first poster on top (z=4), ~8px overlap between each
  const OFFSET = 40;
  const POSTER_W = 48;
  const POSTER_H = 70;
  const containerW = POSTER_W + OFFSET * 3; // 48 + 120 = 168

  return (
    <Link
      to="/profile/$username/lists/$listId"
      params={{ username, listId: list.id }}
      className="group flex items-center gap-5 border-b border-border/50 py-5 transition-opacity last:border-0 hover:opacity-90"
    >
      {/* Stacked covers */}
      <div
        className="relative shrink-0"
        style={{ width: `${containerW}px`, height: `${POSTER_H}px` }}
      >
        {Array.from({ length: 4 }).map((_, i) => {
          const cover = covers[i];
          const posterUrl = cover ? getPosterUrl(cover.posterPath) : "";
          return (
            <div
              key={i}
              className="absolute top-0 overflow-hidden border border-border/40 bg-muted/20"
              style={{
                left: `${i * OFFSET}px`,
                width: `${POSTER_W}px`,
                height: `${POSTER_H}px`,
                zIndex: 4 - i,
                boxShadow: i > 0 ? "-2px 0 4px rgba(0,0,0,0.25)" : undefined,
              }}
            >
              {posterUrl ? (
                <img
                  src={posterUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : null}
            </div>
          );
        })}
        {/* Show item count badge when fewer than 4 covers */}
        {coverCount === 0 ? (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ zIndex: 5 }}
          >
            <span className="font-mono text-[10px] text-muted-foreground/40">
              {list.itemCount}
            </span>
          </div>
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
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
          <span className="font-mono text-[11px] text-muted-foreground">
            items
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">·</span>
          <span className="font-mono text-[11px] text-muted-foreground">
            updated {formatRelativeTime(list.updatedAt)}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">·</span>
          <span
            className="border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em]"
            style={{
              borderColor: list.isPublic
                ? "color-mix(in srgb, var(--primary) 40%, transparent)"
                : "color-mix(in srgb, var(--foreground) 20%, transparent)",
              color: list.isPublic
                ? "var(--primary)"
                : "color-mix(in srgb, var(--foreground) 50%, transparent)",
            }}
          >
            {list.isPublic ? "Public" : "Private"}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5 pt-0.5">
        {derivedTypeLabel ? (
          <span className="border border-border/60 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
            {derivedTypeLabel}
          </span>
        ) : null}
        {list.isRanked ? (
          <span className="border border-border/60 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
            RANKED
          </span>
        ) : null}
      </div>
    </Link>
  );
};
