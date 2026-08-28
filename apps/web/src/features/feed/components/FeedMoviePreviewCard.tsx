import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { getPosterUrl } from "@/features/films/components/utils";
import type { FeedMovieLink } from "@/features/feed/components/feed-row.utils";
import { cn } from "@/lib/utils";

type FeedMoviePreviewCardProps = {
  link: FeedMovieLink;
  title: string;
  releaseYear: number | null;
  posterPath: string | null;
  coverArtUrl?: string | null;
  accentColor: string;
  rightSlot?: ReactNode;
  className?: string;
};

// Shared "attached media" card used by every feed card tier so a review, a
// post, and a plain timeline entry all reference the same media the same
// way (poster/cover + title + year, thin accent edge for the module color).
export const FeedMoviePreviewCard = ({
  link,
  title,
  releaseYear,
  posterPath,
  coverArtUrl,
  accentColor,
  rightSlot,
  className,
}: FeedMoviePreviewCardProps) => {
  const imageUrl = posterPath ? getPosterUrl(posterPath) : (coverArtUrl ?? null);

  return (
    <Link
      {...link}
      className={cn(
        "mt-2 flex max-w-xs items-center gap-3 rounded-lg border border-border/50 py-2 pr-3 pl-2.5 transition-colors hover:bg-secondary/15",
        className,
      )}
      style={{ borderLeftColor: accentColor, borderLeftWidth: 3 }}
      viewTransition
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="h-14 w-9 shrink-0 rounded-md object-cover"
        />
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-foreground">{title}</span>
        <span className="mt-0.5 flex items-center gap-2">
          {releaseYear ? <span className="text-xs text-muted-foreground">{releaseYear}</span> : null}
          {rightSlot}
        </span>
      </span>
    </Link>
  );
};
