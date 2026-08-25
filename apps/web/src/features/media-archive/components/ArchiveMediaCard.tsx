import { memo, type CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { Award } from "lucide-react";
import type { ArchiveCardModuleStyles, ArchiveRatingSource } from "@/features/media-archive/types";
import { cn } from "@/lib/utils";

type ArchiveMediaCardProps = {
  kind: "cinema" | "serial";
  tmdbId: number;
  title: string;
  posterPath: string | null;
  getPosterUrl: (posterPath: string | null | undefined) => string;
  stateLabel: string | null;
  rating: number | null;
  ratingSource: ArchiveRatingSource;
  // Rendered as `{subtitlePrimary}` alone, or `{subtitlePrimary} · {subtitleSecondary}`
  // (in a dimmer shade) when a secondary segment is given.
  subtitlePrimary: string;
  subtitleSecondary?: string | null;
  moduleStyles: ArchiveCardModuleStyles;
  className?: string;
  style?: CSSProperties;
};

// Memoized because the archive grid re-renders on unrelated local state
// (e.g. a filter dropdown opening) - this skips re-rendering every card
// in a potentially large grid when only `openMenu` etc. changed. Props are
// kept as primitives (not JSX) so this comparison stays meaningful.
export const ArchiveMediaCard = memo(function ArchiveMediaCard({
  kind,
  tmdbId,
  title,
  posterPath,
  getPosterUrl,
  stateLabel,
  rating,
  ratingSource,
  subtitlePrimary,
  subtitleSecondary,
  moduleStyles,
  className,
  style,
}: ArchiveMediaCardProps) {
  const to = kind === "cinema" ? "/cinema/$tmdbId" : "/serials/$tmdbId";

  return (
    <Link
      to={to}
      params={{ tmdbId: String(tmdbId) }}
      className={cn("block w-full text-left", className)}
      style={style}
      viewTransition
    >
      <div
        className="relative mb-3 aspect-2/3 overflow-hidden rounded-lg border transition-colors"
        style={{
          borderColor: moduleStyles.border,
          background: moduleStyles.panel,
        }}
      >
        {posterPath ? (
          <img
            src={getPosterUrl(posterPath)}
            alt={`${title} poster`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className="flex h-full w-full flex-col items-center justify-center gap-2"
            style={{ background: moduleStyles.panelSoft }}
          >
            <div
              className="flex h-8 w-8 items-center justify-center"
              style={{ background: moduleStyles.panelStrong }}
            >
              <Award className="h-4 w-4" style={{ color: moduleStyles.accent }} />
            </div>
            <span
              className="font-mono text-[8px] uppercase tracking-[0.22em]"
              style={{ color: moduleStyles.faint }}
            >
              No Art
            </span>
          </div>
        )}

        {stateLabel ? (
          <div className="absolute right-2 top-2">
            <span
              className="border px-2 py-0.5 font-mono text-[9px] tracking-[0.16em]"
              style={{
                borderColor: moduleStyles.accent,
                color: moduleStyles.accent,
                background: moduleStyles.badge,
              }}
            >
              {stateLabel}
            </span>
          </div>
        ) : null}

        {rating !== null ? (
          <div className="absolute bottom-2 right-2">
            <span
              className="border px-2 py-0.5 font-mono text-[9px]"
              style={{
                borderColor: moduleStyles.accent,
                color: moduleStyles.accent,
                background: moduleStyles.badge,
              }}
            >
              {ratingSource === "tmdb"
                ? `TMDB ${rating.toFixed(1)}`
                : rating.toFixed(1)}
            </span>
          </div>
        ) : null}
      </div>

      <p
        className="truncate font-mono text-[11px] leading-tight"
        style={{ color: moduleStyles.text }}
      >
        {title}
      </p>
      <p
        className="truncate font-mono text-[10px]"
        style={{ color: moduleStyles.muted }}
      >
        <span>{subtitlePrimary}</span>
        {subtitleSecondary ? (
          <span style={{ color: moduleStyles.faint }}> · {subtitleSecondary}</span>
        ) : null}
      </p>
    </Link>
  );
});
