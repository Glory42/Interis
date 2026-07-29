import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { MediaPosterGridItem } from "@/features/profile/components/MediaPosterGridItem";
import {
  PROFILE_MEDIA_GRID_CLASSES,
  ProfileMediaGridSkeleton,
} from "@/features/profile/components/ProfileMediaGridSkeleton";
import {
  ProfileTabEmptyState,
  type ProfileTabEmptyStateCta,
} from "@/features/profile/components/ProfileTabEmptyState";
import type { UserInteractionMovie } from "@/features/profile/api";

type FavoritesFilter = "all" | "cinema" | "serial";

const filterTabs: Array<{ key: FavoritesFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "cinema", label: "Cinema" },
  { key: "serial", label: "Serial" },
];

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

  return false;
};

type ProfileMediaInteractionGridSectionProps = {
  errorLabel: string;
  sectionTitle: string;
  emptyState: {
    icon: LucideIcon;
    title: string;
    description: string;
    cta?: ProfileTabEmptyStateCta;
  };
  interactionVerb: string;
  isPending: boolean;
  isError: boolean;
  items: UserInteractionMovie[];
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
};

export const ProfileMediaInteractionGridSection = ({
  errorLabel,
  sectionTitle,
  emptyState,
  interactionVerb,
  isPending,
  isError,
  items,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
}: ProfileMediaInteractionGridSectionProps) => {
  const [activeFilter, setActiveFilter] = useState<FavoritesFilter>("all");

  const filteredItems = useMemo(() => {
    return items.filter((item) => filterMatches(item, activeFilter));
  }, [items, activeFilter]);

  return (
    <>
      {isPending ? <ProfileMediaGridSkeleton /> : null}

      {isError ? (
        <div className="rounded-xl border border-border/60 bg-card/30 p-4 text-sm text-destructive">
          {errorLabel}
        </div>
      ) : null}

      {!isPending && !isError && items.length === 0 ? (
        <ProfileTabEmptyState
          icon={emptyState.icon}
          title={emptyState.title}
          description={emptyState.description}
          cta={emptyState.cta}
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
                    className="rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest transition-colors"
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
            <div className={PROFILE_MEDIA_GRID_CLASSES}>
              {filteredItems.map((item) => (
                <MediaPosterGridItem
                  key={`${sectionTitle}-${item.mediaType}-${item.tmdbId}`}
                  item={item}
                  interactionVerb={interactionVerb}
                />
              ))}
            </div>
          )}

          {hasMore ? (
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                disabled={isLoadingMore}
                onClick={onLoadMore}
                className="rounded-full border border-border/70 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoadingMore ? "Loading..." : "Load more"}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
};
