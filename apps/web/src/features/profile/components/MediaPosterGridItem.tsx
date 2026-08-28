import { Link } from "@tanstack/react-router";
import { Disc3, BookOpen } from "lucide-react";
import { getPosterUrl } from "@/features/films/components/utils";
import type { UserInteractionMovie } from "@/features/profile/api";
import { getRelativeTime } from "@/features/profile/utils/profile.utils";

type MediaPosterGridItemProps = {
  item: UserInteractionMovie;
  interactionVerb: string;
};

export const MediaPosterGridItem = ({ item, interactionVerb }: MediaPosterGridItemProps) => {
  const isAlbum = item.mediaType === "album";
  const isBook = item.mediaType === "book";
  const coverUrl = isAlbum || isBook ? (item.coverArtUrl ?? item.coverImageUrl ?? null) : null;
  const posterUrl = item.posterPath ? getPosterUrl(item.posterPath) : null;
  const imageUrl = posterUrl ?? coverUrl;

  const card = (
    <>
      <div
        className="relative mb-1.5 overflow-hidden rounded-lg border border-border/70 bg-card/25"
        style={{ aspectRatio: isAlbum ? "1/1" : "2/3" }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.title}
            className="h-full w-full object-cover opacity-90 transition-[transform,opacity] duration-500 group-hover:scale-105 group-hover:opacity-100"
            loading="lazy"
          />
        ) : isAlbum || isBook ? (
          <div className="flex h-full w-full items-center justify-center bg-muted/20">
            {isAlbum ? (
              <Disc3 className="h-8 w-8 opacity-40" style={{ color: "var(--module-music)" }} />
            ) : (
              <BookOpen className="h-8 w-8 opacity-40" style={{ color: "var(--module-book)" }} />
            )}
          </div>
        ) : null}
      </div>

      <p className="line-clamp-1 text-[11px] font-semibold text-foreground/95 transition-colors group-hover:text-primary">
        {item.title}
      </p>
      <p className="mt-0.5 text-[10px] text-muted-foreground/85">
        {item.releaseYear ?? "Unknown year"} · {interactionVerb}{" "}
        {getRelativeTime(item.lastInteractionAt)}
      </p>
    </>
  );

  if (item.mediaType === "movie" && item.tmdbId != null) {
    return (
      <Link to="/cinema/$tmdbId" params={{ tmdbId: String(item.tmdbId) }} className="group block" viewTransition>
        {card}
      </Link>
    );
  }

  if (item.mediaType === "tv" && item.tmdbId != null) {
    return (
      <Link to="/serials/$tmdbId" params={{ tmdbId: String(item.tmdbId) }} className="group block" viewTransition>
        {card}
      </Link>
    );
  }

  if (isAlbum && item.mbid) {
    return (
      <Link to="/music/$mbid" params={{ mbid: item.mbid }} className="group block" viewTransition>
        {card}
      </Link>
    );
  }

  if (isBook && item.volumeId) {
    return (
      <Link to="/books/$volumeId" params={{ volumeId: item.volumeId }} className="group block" viewTransition>
        {card}
      </Link>
    );
  }

  return <div className="group block">{card}</div>;
};
