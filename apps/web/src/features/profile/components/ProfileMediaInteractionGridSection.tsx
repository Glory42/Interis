import { MediaPosterGridItem } from "@/features/profile/components/MediaPosterGridItem";
import { SentenceSelect } from "@/components/ui/SentenceSelect";
import {
  PROFILE_MEDIA_GRID_CLASSES,
  ProfileMediaGridSkeleton,
} from "@/features/profile/components/ProfileMediaGridSkeleton";
import {
  ProfileTabEmptyState,
  type ProfileTabEmptyStateCta,
} from "@/features/profile/components/ProfileTabEmptyState";
import type { UserInteractionFilm } from "@/features/profile/api";
import {
  mediaShelfCount,
  mediaShelfOptions,
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
  items: UserInteractionFilm[];
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
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-[color:var(--line)] pb-2">
            <h2 className="display-3 text-foreground">{sectionTitle}</h2>
            <p className="body-s text-muted-foreground">
              {`Showing ${mediaShelfCount(activeFilter, counts)} `}
              <SentenceSelect value={activeFilter} options={mediaShelfOptions(counts)} onChange={onFilterChange} />
              {", newest first."}
            </p>
          </div>

          {items.length === 0 ? (
            <p className="body-s text-muted-foreground">Nothing here for this filter yet.</p>
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
