import { Link } from "@tanstack/react-router";
import { getPosterUrl } from "@/features/films/components/utils";
import { useTrendingOnInteris } from "@/features/feed/hooks/useFeed";
import type { TrendingOnInterisItem } from "@/features/feed/types";

type RailEntry = {
  id: string;
  title: string;
  to: "/cinema/$tmdbId" | "/serials/$tmdbId";
  tmdbId: number;
  posterPath: string | null;
  color: string;
  module: "CINEMA" | "SERIAL";
};

const toRailEntry = (item: TrendingOnInterisItem): RailEntry => ({
  id: `${item.mediaType}:${item.tmdbId}`,
  title: item.title,
  to: item.mediaType === "tv" ? "/serials/$tmdbId" : "/cinema/$tmdbId",
  tmdbId: item.tmdbId,
  posterPath: item.posterPath,
  color: item.mediaType === "tv" ? "var(--module-serial)" : "var(--module-cinema)",
  module: item.mediaType === "tv" ? "SERIAL" : "CINEMA",
});

export const TrendingOnInterisRail = () => {
  const { data } = useTrendingOnInteris();
  const entries = (data ?? []).map(toRailEntry);

  return (
    <section>
      <p className="theme-kicker border-b border-border/50 pb-2 text-[9px] text-(--module-serial)">
        Trending on Interis
      </p>

      {entries.length > 0 ? (
        <div className="divide-y divide-border/30">
          {entries.map((entry) => (
            <Link
              key={entry.id}
              to={entry.to}
              params={{ tmdbId: String(entry.tmdbId) }}
              className="group -mx-2 flex items-center gap-3 px-2 py-2.5 transition-colors hover:bg-foreground/[0.025]"
              viewTransition
            >
              {entry.posterPath ? (
                <img
                  src={getPosterUrl(entry.posterPath)}
                  alt=""
                  loading="lazy"
                  className="h-11 w-8 shrink-0 rounded-md object-cover"
                />
              ) : (
                <span
                  className="h-11 w-8 shrink-0 rounded-md bg-muted/40"
                  style={{ borderLeft: `2px solid ${entry.color}` }}
                />
              )}
              <span className="min-w-0 flex-1 truncate text-sm text-foreground/85 group-hover:text-foreground">
                {entry.title}
              </span>
              <span
                className="theme-kicker shrink-0 rounded-full border px-1.5 py-0.5 text-[8px]"
                style={{ borderColor: entry.color, color: entry.color }}
              >
                {entry.module}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="pt-3 text-xs text-muted-foreground">
          Not enough logs yet to calculate trends.
        </p>
      )}
    </section>
  );
};
