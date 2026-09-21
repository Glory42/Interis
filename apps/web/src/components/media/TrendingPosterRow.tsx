import { Link } from "@tanstack/react-router";
import { getPosterUrl } from "@/features/films/components/utils";

export type TrendingPosterItem = {
  id: string;
  title: string;
  tmdbId: number;
  posterPath: string | null;
};

type TrendingPosterRowProps = {
  title: string;
  to: "/cinema/$tmdbId" | "/serials/$tmdbId";
  accentColor: string;
  isLoading: boolean;
  isError: boolean;
  items: TrendingPosterItem[];
};

const PosterCard = ({
  item,
  to,
}: {
  item: TrendingPosterItem;
  to: TrendingPosterRowProps["to"];
}) => (
  <Link
    to={to}
    params={{ tmdbId: String(item.tmdbId) }}
    viewTransition
    className="group w-44 shrink-0 sm:w-52"
  >
    <div className="h-64 w-44 overflow-hidden rounded-lg border border-border/60 shadow-lg sm:h-76 sm:w-52">
      <img
        src={getPosterUrl(item.posterPath)}
        alt={`${item.title} poster`}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
    </div>
    <p className="mt-1.5 truncate text-xs text-foreground/85 group-hover:text-foreground">
      {item.title}
    </p>
  </Link>
);

export const TrendingPosterRow = ({
  title,
  to,
  accentColor,
  isLoading,
  isError,
  items,
}: TrendingPosterRowProps) => {
  if (isError || (!isLoading && items.length === 0)) {
    return null;
  }

  return (
    <section>
      <p
        className="theme-kicker mb-3 border-b pb-2 text-[10px]"
        style={{ borderColor: `${accentColor}40`, color: accentColor }}
      >
        {title}
      </p>

      <div className="edge-fade-x relative overflow-hidden">
        {isLoading ? (
          <div className="flex gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-64 w-44 shrink-0 animate-pulse rounded-lg bg-muted/30 sm:h-76 sm:w-52"
              />
            ))}
          </div>
        ) : (
          <div className="animate-marquee flex w-max gap-4 hover:[animation-play-state:paused]">
            {[...items, ...items].map((item, index) => (
              <PosterCard key={`${item.id}-${index}`} item={item} to={to} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
