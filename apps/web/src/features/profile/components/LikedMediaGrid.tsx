import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { getPosterUrl } from "@/features/films/components/utils";
import type { UserInteractionMovie } from "@/features/profile/api";
import { PROFILE_MEDIA_GRID_CLASSES } from "@/features/profile/components/ProfileMediaGridSkeleton";
import { getRelativeTime } from "@/features/profile/utils/profile.utils";

export type MediaFilter = "all" | "cinema" | "serial";

const routeByMediaType: Record<string, "/cinema/$tmdbId" | "/serials/$tmdbId" | null> = {
  movie: "/cinema/$tmdbId",
  tv: "/serials/$tmdbId",
};

export const LikedMediaGrid = ({
  items,
  filter,
}: {
  items: UserInteractionMovie[];
  filter: MediaFilter;
}) => {
  const filtered = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "cinema") return items.filter((i) => i.mediaType === "movie");
    return items.filter((i) => i.mediaType === "tv");
  }, [items, filter]);

  if (filtered.length === 0) {
    return (
      <div className="border px-3 py-2 text-xs profile-shell-border profile-shell-muted profile-shell-panel">
        No {filter === "all" ? "items" : filter} liked yet.
      </div>
    );
  }

  return (
    <div className={PROFILE_MEDIA_GRID_CLASSES}>
      {filtered.map((item) => {
        const mediaRoute = routeByMediaType[item.mediaType];
        const card = (
          <>
            <div className="relative mb-1.5 aspect-2/3 overflow-hidden border border-border/70 bg-card/25">
              <img
                src={getPosterUrl(item.posterPath)}
                alt={item.title}
                className="h-full w-full object-cover opacity-90 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
                loading="lazy"
              />
            </div>
            <p className="line-clamp-1 text-[11px] font-semibold text-foreground/95 transition-colors group-hover:text-primary">
              {item.title}
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground/85">
              {item.releaseYear ?? "Unknown year"} · liked {getRelativeTime(item.lastInteractionAt)}
            </p>
          </>
        );

        if (mediaRoute) {
          return (
            <Link
              key={`media-${item.mediaType}-${item.tmdbId}`}
              to={mediaRoute}
              params={{ tmdbId: String(item.tmdbId) }}
              className="group block"
              viewTransition
            >
              {card}
            </Link>
          );
        }

        return (
          <div key={`media-${item.mediaType}-${item.tmdbId}`} className="group block">
            {card}
          </div>
        );
      })}
    </div>
  );
};
