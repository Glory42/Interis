import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Disc3, BookOpen } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getPosterUrl } from "@/features/films/components/utils";
import { ProfileTabEmptyState } from "@/features/profile/components/ProfileTabEmptyState";
import type { UserInteractionMovie } from "@/features/profile/api";
import { getRelativeTime } from "@/features/profile/utils/profile.utils";

type FavoritesFilter = "all" | "cinema" | "serial" | "music" | "books";

const filterTabs: Array<{ key: FavoritesFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "cinema", label: "Cinema" },
  { key: "serial", label: "Serial" },
  { key: "music", label: "Music" },
  { key: "books", label: "Books" },
];

const filterMatches = (item: UserInteractionMovie, filter: FavoritesFilter): boolean => {
  if (filter === "all") return true;
  if (filter === "cinema") return item.mediaType === "movie";
  if (filter === "serial") return item.mediaType === "tv";
  if (filter === "music") return item.mediaType === "album";
  if (filter === "books") return item.mediaType === "book";
  return false;
};

const getItemKey = (item: UserInteractionMovie, prefix: string): string => {
  if (item.mediaType === "album" && item.mbid) return `${prefix}-album-${item.mbid}`;
  if (item.mediaType === "book" && item.volumeId) return `${prefix}-book-${item.volumeId}`;
  return `${prefix}-${item.mediaType}-${item.tmdbId}`;
};

type ItemCardProps = {
  item: UserInteractionMovie;
  interactionVerb: string;
  sectionTitle: string;
};

const ItemCard = ({ item, interactionVerb, sectionTitle }: ItemCardProps) => {
  const coverUrl = item.coverArtUrl ?? item.coverImageUrl ?? null;
  const posterUrl = item.posterPath ? getPosterUrl(item.posterPath) : null;
  const imageUrl = posterUrl ?? coverUrl;

  const isAlbum = item.mediaType === "album";
  const isBook = item.mediaType === "book";

  const cardContent = (
    <>
      <div className="relative mb-1.5 overflow-hidden border border-border/70 bg-card/25" style={{ aspectRatio: isAlbum ? "1/1" : "2/3" }}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.title}
            className="h-full w-full object-cover opacity-90 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted/20">
            {isAlbum ? (
              <Disc3 className="h-8 w-8 opacity-40" style={{ color: "var(--module-music)" }} />
            ) : isBook ? (
              <BookOpen className="h-8 w-8 opacity-40" style={{ color: "var(--module-book)" }} />
            ) : null}
          </div>
        )}
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

  if (isAlbum && item.mbid) {
    return (
      <Link
        key={getItemKey(item, sectionTitle)}
        to="/music/$mbid"
        params={{ mbid: item.mbid }}
        className="group block"
        viewTransition
      >
        {cardContent}
      </Link>
    );
  }

  if (isBook && item.volumeId) {
    return (
      <Link
        key={getItemKey(item, sectionTitle)}
        to="/books/$volumeId"
        params={{ volumeId: item.volumeId }}
        className="group block"
        viewTransition
      >
        {cardContent}
      </Link>
    );
  }

  if ((item.mediaType === "movie" || item.mediaType === "tv") && item.tmdbId != null) {
    const to = item.mediaType === "tv" ? "/serials/$tmdbId" : "/cinema/$tmdbId";
    return (
      <Link
        key={getItemKey(item, sectionTitle)}
        to={to}
        params={{ tmdbId: String(item.tmdbId) }}
        className="group block"
        viewTransition
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <div key={getItemKey(item, sectionTitle)} className="group block">
      {cardContent}
    </div>
  );
};

type ProfileMediaInteractionGridSectionProps = {
  loadingLabel: string;
  errorLabel: string;
  sectionTitle: string;
  emptyState: {
    icon: LucideIcon;
    title: string;
    description: string;
  };
  interactionVerb: string;
  isPending: boolean;
  isError: boolean;
  items: UserInteractionMovie[];
};

export const ProfileMediaInteractionGridSection = ({
  loadingLabel,
  errorLabel,
  sectionTitle,
  emptyState,
  interactionVerb,
  isPending,
  isError,
  items,
}: ProfileMediaInteractionGridSectionProps) => {
  const [activeFilter, setActiveFilter] = useState<FavoritesFilter>("all");

  const filteredItems = useMemo(() => {
    return items.filter((item) => filterMatches(item, activeFilter));
  }, [items, activeFilter]);

  return (
    <>
      {isPending ? (
        <div className=" border border-border/60 bg-card/30 p-4 text-sm text-muted-foreground">
          {loadingLabel}
        </div>
      ) : null}

      {isError ? (
        <div className=" border border-border/60 bg-card/30 p-4 text-sm text-destructive">
          {errorLabel}
        </div>
      ) : null}

      {!isPending && !isError && items.length === 0 ? (
        <ProfileTabEmptyState
          icon={emptyState.icon}
          title={emptyState.title}
          description={emptyState.description}
        />
      ) : null}

      {!isPending && !isError && items.length > 0 ? (
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              {sectionTitle}
            </h3>
            <div className="flex flex-wrap justify-end gap-1">
              {filterTabs.map((filterTab) => {
                const isActive = activeFilter === filterTab.key;

                return (
                  <button
                    key={`${sectionTitle}-filter-${filterTab.key}`}
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
              No {activeFilter === "all" ? "items" : activeFilter} {interactionVerb} yet.
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {filteredItems.map((item) => (
                <ItemCard
                  key={getItemKey(item, sectionTitle)}
                  item={item}
                  interactionVerb={interactionVerb}
                  sectionTitle={sectionTitle}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </>
  );
};
