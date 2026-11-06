import { memo } from "react";
import { Link } from "@tanstack/react-router";
import { Rocket } from "lucide-react";
import type { ViewerStatus } from "@/features/viewer-status/api";
import { tmdbImageUrl, type TmdbImageSize } from "@/lib/tmdb-image";
import { cn } from "@/lib/utils";

export type PosterCardSize = "L" | "M" | "S" | "XS";

export type PosterCardMedia = {
  mediaType: "movie" | "tv";
  tmdbId: number;
  title: string;
  posterPath: string | null;
  year?: number | null;
  credit?: string | null;
};

type PosterCardProps = {
  media: PosterCardMedia;
  size: PosterCardSize;
  // The signed-in viewer's own marks (from useViewerStatuses).
  status?: ViewerStatus | null;
  tmdbScore?: number | null;
  // Replaces the "year · credit" line, e.g. "Liked 2d".
  meta?: string;
  className?: string;
};

const imageSizeBySize: Record<PosterCardSize, TmdbImageSize> = { L: "w342", M: "w342", S: "w185", XS: "w92" };

const titleClassBySize: Record<PosterCardSize, string> = {
  L: "display-4 mt-1.5",
  M: "mt-1.5 truncate text-xs font-semibold",
  S: "mt-1 truncate text-[11px] font-semibold",
  XS: "sr-only",
};

const PosterSlate = ({ status, tmdbScore }: { status?: ViewerStatus | null; tmdbScore?: number | null }) => {
  const hasMarks = status && (status.watched || status.liked || status.rating !== null);

  if (hasMarks) {
    return (
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/80 px-1.5 py-[3px] font-mono text-[10px] font-semibold text-[#dddddd]">
        <span className="flex gap-1">
          {status.watched ? <span aria-label="Watched">◉</span> : null}
          {status.liked ? (
            <span aria-label="Liked" className="text-[color:var(--like)]">
              ♥
            </span>
          ) : null}
        </span>
        {status.rating !== null ? (
          <span aria-label={`Your score ${status.rating.toFixed(1)}`} className="flex items-center gap-0.5 text-primary">
            <Rocket aria-hidden className="size-2.5" />
            {status.rating.toFixed(1)}
          </span>
        ) : null}
      </div>
    );
  }

  if (tmdbScore) {
    return (
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/80 px-1.5 py-[3px] font-mono text-[10px] font-semibold text-[#dddddd]">
        <span className="text-[#8a8a8a]">TMDB</span>
        <span>{tmdbScore.toFixed(1)}</span>
      </div>
    );
  }

  return null;
};

const PosterCardBase = ({ media, size, status, tmdbScore, meta, className }: PosterCardProps) => {
  const posterUrl = tmdbImageUrl(media.posterPath, imageSizeBySize[size]);
  const metaLine = meta ?? [media.year, media.credit].filter(Boolean).join(" · ");

  return (
    <Link
      to={media.mediaType === "movie" ? "/movies/$tmdbId" : "/serials/$tmdbId"}
      params={{ tmdbId: String(media.tmdbId) }}
      className={cn("group block min-w-0", className)}
      viewTransition
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-sm border border-[color:var(--line-strong)] bg-card">
        {posterUrl ? (
          <img src={posterUrl} alt="" loading="lazy" className="size-full object-cover transition-opacity group-hover:opacity-90" />
        ) : (
          <div
            data-testid="poster-typeset"
            aria-hidden
            className="flex size-full items-end p-2 font-display text-sm leading-tight font-bold text-foreground"
          >
            {media.title}
          </div>
        )}
        <PosterSlate status={status} tmdbScore={tmdbScore} />
      </div>
      <p className={cn("text-foreground", titleClassBySize[size])}>{media.title}</p>
      {size !== "XS" && metaLine ? (
        <p className="truncate font-mono text-[10px] text-muted-foreground uppercase">{metaLine}</p>
      ) : null}
    </Link>
  );
};

// Poster grids re-render on every filter/menu change; memo keeps cards still.
export const PosterCard = memo(PosterCardBase);
