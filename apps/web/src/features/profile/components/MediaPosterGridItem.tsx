import { Link } from "@tanstack/react-router";
import { getPosterUrl } from "@/features/films/components/utils";
import type { UserInteractionMovie } from "@/features/profile/api";
import { getRelativeTime } from "@/features/profile/utils/profile.utils";

const routeByMediaType: Record<string, "/cinema/$tmdbId" | "/serials/$tmdbId" | null> = {
  movie: "/cinema/$tmdbId",
  tv: "/serials/$tmdbId",
};

type MediaPosterGridItemProps = {
  item: UserInteractionMovie;
  interactionVerb: string;
};

export const MediaPosterGridItem = ({ item, interactionVerb }: MediaPosterGridItemProps) => {
  const mediaRoute = routeByMediaType[item.mediaType];

  const card = (
    <>
      <div className="relative mb-1.5 aspect-2/3 overflow-hidden rounded-lg border border-border/70 bg-card/25">
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
        {item.releaseYear ?? "Unknown year"} · {interactionVerb}{" "}
        {getRelativeTime(item.lastInteractionAt)}
      </p>
    </>
  );

  if (mediaRoute) {
    return (
      <Link to={mediaRoute} params={{ tmdbId: String(item.tmdbId) }} className="group block" viewTransition>
        {card}
      </Link>
    );
  }

  return <div className="group block">{card}</div>;
};
