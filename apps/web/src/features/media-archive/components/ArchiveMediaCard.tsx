import { memo, type CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import type { ArchiveCardModuleStyles, ArchiveRatingSource } from "@/features/media-archive/types";
import { cn } from "@/lib/utils";

type ArchiveMediaCardKind = "cinema" | "serial" | "book" | "album";

type ArchiveMediaCardProps = {
  kind: ArchiveMediaCardKind;
  id: string;
  title: string;
  imageUrl: string | null;
  fallbackIcon: LucideIcon;
  fallbackLabel: string;
  aspectClassName?: string;
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

const ArchiveCardLink = ({
  kind,
  id,
  className,
  style,
  children,
}: {
  kind: ArchiveMediaCardKind;
  id: string;
  className?: string;
  style?: CSSProperties;
  children: React.ReactNode;
}) => {
  switch (kind) {
    case "cinema":
      return (
        <Link to="/cinema/$tmdbId" params={{ tmdbId: id }} className={className} style={style} viewTransition>
          {children}
        </Link>
      );
    case "serial":
      return (
        <Link to="/serials/$tmdbId" params={{ tmdbId: id }} className={className} style={style} viewTransition>
          {children}
        </Link>
      );
    case "book":
      return (
        <Link to="/books/$volumeId" params={{ volumeId: id }} className={className} style={style} viewTransition>
          {children}
        </Link>
      );
    case "album":
      return (
        <Link to="/music/$mbid" params={{ mbid: id }} className={className} style={style} viewTransition>
          {children}
        </Link>
      );
  }
};

// Memoized because the archive grid re-renders on unrelated local state
// (e.g. a filter dropdown opening) - this skips re-rendering every card
// in a potentially large grid when only `openMenu` etc. changed. Props are
// kept as primitives (not JSX) so this comparison stays meaningful.
export const ArchiveMediaCard = memo(function ArchiveMediaCard({
  kind,
  id,
  title,
  imageUrl,
  fallbackIcon: FallbackIcon,
  fallbackLabel,
  aspectClassName = "aspect-2/3",
  stateLabel,
  rating,
  ratingSource,
  subtitlePrimary,
  subtitleSecondary,
  moduleStyles,
  className,
  style,
}: ArchiveMediaCardProps) {
  return (
    <ArchiveCardLink kind={kind} id={id} className={cn("block w-full text-left", className)} style={style}>
      <div
        className={cn("relative mb-3 overflow-hidden rounded-lg border transition-colors", aspectClassName)}
        style={{
          borderColor: moduleStyles.border,
          background: moduleStyles.panel,
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`${title} cover`}
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
              <FallbackIcon className="h-4 w-4" style={{ color: moduleStyles.accent }} />
            </div>
            <span
              className="font-mono text-[8px] uppercase tracking-[0.22em]"
              style={{ color: moduleStyles.faint }}
            >
              {fallbackLabel}
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
    </ArchiveCardLink>
  );
});
