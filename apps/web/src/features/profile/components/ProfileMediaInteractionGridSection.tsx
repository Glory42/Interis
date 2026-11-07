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
import {
  mediaShelfCount,
  mediaShelfFilters,
  type MediaShelfCounts,
  type MediaShelfFilter,
} from "@/features/profile/components/media-shelf-filter";

type ProfileMediaInteractionGridSectionProps = {
  errorLabel: string;
  sectionTitle: string;
  emptyState: {
    visitorText: string;
    ownerText?: string;
    ownerAction?: ProfileTabEmptyStateCta;
  };
  isOwner: boolean;
  interactionVerb: string;
  isPending: boolean;
  isError: boolean;
  items: UserInteractionMovie[];
  counts: MediaShelfCounts;
  activeFilter: MediaShelfFilter;
  onFilterChange: (filter: MediaShelfFilter) => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
};

export const ProfileMediaInteractionGridSection = ({
  errorLabel,
  sectionTitle,
  emptyState,
  isOwner,
  interactionVerb,
  isPending,
  isError,
  items,
  counts,
  activeFilter,
  onFilterChange,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
}: ProfileMediaInteractionGridSectionProps) => {
  const isShelfEmpty = mediaShelfCount("all", counts) === 0;

  return (
    <>
      {isPending ? <ProfileMediaGridSkeleton /> : null}

      {isError ? (
        <div className="rounded-xl border border-border/60 bg-card/30 p-4 text-sm text-destructive">
          {errorLabel}
        </div>
      ) : null}

      {!isPending && !isError && isShelfEmpty ? (
        <ProfileTabEmptyState isOwner={isOwner} {...emptyState} />
      ) : null}

      {!isPending && !isError && !isShelfEmpty ? (
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              {sectionTitle}
            </h3>
            <div className="flex flex-wrap justify-end gap-1">
              {mediaShelfFilters.map((filterTab) => {
                const isActive = activeFilter === filterTab.key;

                return (
                  <button
                    key={`${sectionTitle}-filter-${filterTab.key}`}
                    type="button"
                    className="rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest transition-colors"
                    style={
                      isActive
                        ? {
                            borderColor: "var(--shell-accent)",
                            color: "var(--shell-accent)",
                            background:
                              "color-mix(in srgb, var(--shell-accent) 8%, transparent)",
                          }
                        : {
                            borderColor: "var(--shell-border)",
                            color: "var(--shell-muted)",
                            background: "transparent",
                          }
                    }
                    onClick={() => {
                      onFilterChange(filterTab.key);
                    }}
                  >
                    {filterTab.label} ({mediaShelfCount(filterTab.key, counts)})
                  </button>
                );
              })}
            </div>
          </div>

          {items.length === 0 ? (
            <div className="border px-3 py-2 text-xs shell-border shell-muted surface">
              No {activeFilter === "all" ? "items" : activeFilter} {interactionVerb} yet.
            </div>
          ) : (
            <div className={PROFILE_MEDIA_GRID_CLASSES}>
              {items.map((item) => (
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
