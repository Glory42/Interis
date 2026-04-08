import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Heart } from "lucide-react";
import { ProfileTabEmptyState } from "@/features/profile/components/ProfileTabEmptyState";
import { getPosterUrl } from "@/features/films/components/utils";
import { useUserLikedFilms } from "@/features/profile/hooks/useProfile";
import { getRelativeTime } from "@/features/profile/utils/profile.utils";
import type { UserInteractionMovie } from "@/features/profile/api";

type ProfileLikedPageProps = {
  username: string;
};

type FavoritesFilter = "all" | "cinema" | "serial" | "codex" | "echoes";

const filterTabs: Array<{ key: FavoritesFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "cinema", label: "Cinema" },
  { key: "serial", label: "Serial" },
  { key: "codex", label: "Codex" },
  { key: "echoes", label: "Echoes" },
];

const routeByMediaType: Record<string, "/cinema/$tmdbId" | "/serials/$tmdbId" | null> = {
  movie: "/cinema/$tmdbId",
  tv: "/serials/$tmdbId",
  book: null,
  music: null,
};

const filterMatches = (item: UserInteractionMovie, filter: FavoritesFilter): boolean => {
  if (filter === "all") {
    return true;
  }

  if (filter === "cinema") {
    return item.mediaType === "movie";
  }

  if (filter === "serial") {
    return item.mediaType === "tv";
  }

  if (filter === "codex") {
    return item.mediaType === "book";
  }

  return item.mediaType === "music";
};

export const ProfileLikedPage = ({ username }: ProfileLikedPageProps) => {
  const likedQuery = useUserLikedFilms(username);
  const [activeFilter, setActiveFilter] = useState<FavoritesFilter>("all");
  const items = likedQuery.data ?? [];
  const filteredItems = items.filter((item) => filterMatches(item, activeFilter));

  return (
    <>
      {likedQuery.isPending ? (
        <div className=" border border-border/60 bg-card/30 p-4 text-sm text-muted-foreground">
          Loading liked films...
        </div>
      ) : null}

      {likedQuery.isError ? (
        <div className=" border border-border/60 bg-card/30 p-4 text-sm text-destructive">
          Could not load liked films.
        </div>
      ) : null}

      {!likedQuery.isPending && !likedQuery.isError && items.length === 0 ? (
        <ProfileTabEmptyState
          icon={Heart}
          title="No likes yet"
          description="This profile has not liked any items yet."
        />
      ) : null}

      {!likedQuery.isPending && !likedQuery.isError && items.length > 0 ? (
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Likes
            </h3>
            <div className="flex flex-wrap justify-end gap-1">
              {filterTabs.map((filterTab) => {
                const isActive = activeFilter === filterTab.key;

                return (
                  <button
                    key={`likes-filter-${filterTab.key}`}
                    type="button"
                    className="border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest transition-colors"
                    style={
                      isActive
                        ? {
                            borderColor: "var(--profile-shell-accent)",
                            color: "var(--profile-shell-accent)",
                            background:
                              "color-mix(in srgb, var(--profile-shell-accent) 8%, transparent)",
                          }
                        : {
                            borderColor: "var(--profile-shell-border)",
                            color: "var(--profile-shell-muted)",
                            background: "transparent",
                          }
                    }
                    onClick={() => {
                      setActiveFilter(filterTab.key);
                    }}
                  >
                    {filterTab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className="border px-3 py-2 text-xs profile-shell-border profile-shell-muted profile-shell-panel">
              No {activeFilter === "all" ? "items" : activeFilter} likes yet.
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {filteredItems.map((item) => {
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
                      {item.releaseYear ?? "Unknown year"} · liked{" "}
                      {getRelativeTime(item.lastInteractionAt)}
                    </p>
                  </>
                );

                if (mediaRoute) {
                  return (
                    <Link
                      key={`liked-${item.mediaType}-${item.tmdbId}`}
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
                  <div
                    key={`liked-${item.mediaType}-${item.tmdbId}`}
                    className="group block"
                  >
                    {card}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </>
  );
};
