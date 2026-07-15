import { useMemo, useState } from "react";
import { Heart } from "lucide-react";
import { ProfileTabEmptyState } from "@/features/profile/components/ProfileTabEmptyState";
import { LikedMediaGrid, type MediaFilter } from "@/features/profile/components/LikedMediaGrid";
import { LikedListCard } from "@/features/profile/components/LikedListCard";
import { LikedReviewCard } from "@/features/profile/components/LikedReviewCard";
import {
  useUserLikedFilms,
  useUserLikedLists,
  useUserLikedReviews,
} from "@/features/profile/hooks/useProfile";

type LikedTab = "medias" | "reviews" | "lists";
type ListFilter = "all" | "cinema" | "serial" | "mixed";

const topTabs: Array<{ key: LikedTab; label: string }> = [
  { key: "medias", label: "Medias" },
  { key: "reviews", label: "Reviews" },
  { key: "lists", label: "Lists" },
];

const mediaSubFilters: Array<{ key: MediaFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "cinema", label: "Cinema" },
  { key: "serial", label: "Serial" },
];

const listSubFilters: Array<{ key: ListFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "cinema", label: "Cinema" },
  { key: "serial", label: "Serial" },
  { key: "mixed", label: "Mixed" },
];

const tabButtonStyle = (isActive: boolean): React.CSSProperties =>
  isActive
    ? {
        borderColor: "var(--profile-shell-accent)",
        color: "var(--profile-shell-accent)",
        background: "color-mix(in srgb, var(--profile-shell-accent) 8%, transparent)",
      }
    : {
        borderColor: "var(--profile-shell-border)",
        color: "var(--profile-shell-muted)",
        background: "transparent",
      };

type ProfileLikedPageProps = {
  username: string;
};

export const ProfileLikedPage = ({ username }: ProfileLikedPageProps) => {
  const [activeTab, setActiveTab] = useState<LikedTab>("medias");
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>("all");
  const [reviewFilter, setReviewFilter] = useState<MediaFilter>("all");
  const [listFilter, setListFilter] = useState<ListFilter>("all");

  const mediasQuery = useUserLikedFilms(username);
  const reviewsQuery = useUserLikedReviews(username);
  const listsQuery = useUserLikedLists(username);

  const mediaItems = mediasQuery.data?.pages.flat() ?? [];
  const reviewItems = useMemo(
    () => reviewsQuery.data?.pages.flat() ?? [],
    [reviewsQuery.data],
  );
  const listItems = useMemo(
    () => listsQuery.data?.pages.flat() ?? [],
    [listsQuery.data],
  );

  const filteredReviews = useMemo(() => {
    if (reviewFilter === "all") return reviewItems;
    if (reviewFilter === "cinema") return reviewItems.filter((r) => r.mediaType === "movie");
    return reviewItems.filter((r) => r.mediaType === "tv");
  }, [reviewItems, reviewFilter]);

  const filteredLists = useMemo(() => {
    if (listFilter === "all") return listItems;
    if (listFilter === "mixed") return listItems.filter((l) => !l.derivedType || l.derivedType === "mixed");
    return listItems.filter((l) => l.derivedType === listFilter);
  }, [listItems, listFilter]);

  const countByTab: Record<LikedTab, number | undefined> = {
    medias: mediasQuery.isPending ? undefined : mediaItems.length,
    reviews: reviewsQuery.isPending ? undefined : reviewItems.length,
    lists: listsQuery.isPending ? undefined : listItems.length,
  };

  const activeSubFilters =
    activeTab === "medias"
      ? { filters: mediaSubFilters, active: mediaFilter, onChange: setMediaFilter as (k: string) => void }
      : activeTab === "reviews"
        ? { filters: mediaSubFilters, active: reviewFilter, onChange: setReviewFilter as (k: string) => void }
        : { filters: listSubFilters, active: listFilter, onChange: setListFilter as (k: string) => void };

  return (
    <div>
      {/* Heading */}
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        Likes
        {countByTab[activeTab] !== undefined ? (
          <span className="ml-1 profile-shell-accent">({countByTab[activeTab]})</span>
        ) : null}
      </p>

      {/* Single row: sub-filters left, top tabs right */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-1">
        <div className="flex flex-wrap items-center gap-1">
          {topTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className="border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest transition-colors"
              style={tabButtonStyle(activeTab === tab.key)}
              onClick={() => { setActiveTab(tab.key); }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {activeSubFilters.filters.map((f) => (
            <button
              key={f.key}
              type="button"
              className="border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest transition-colors"
              style={tabButtonStyle(activeSubFilters.active === f.key)}
              onClick={() => { activeSubFilters.onChange(f.key); }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {activeTab === "medias" ? (
        <>
          {mediasQuery.isPending ? (
            <div className="border border-border/60 bg-card/30 p-4 text-sm text-muted-foreground">
              Loading liked media...
            </div>
          ) : mediasQuery.isError ? (
            <div className="border border-border/60 bg-card/30 p-4 text-sm text-destructive">
              Could not load liked media.
            </div>
          ) : mediaItems.length === 0 ? (
            <ProfileTabEmptyState
              icon={Heart}
              title="No liked media yet"
              description="This profile has not liked any films or series yet."
            />
          ) : (
            <LikedMediaGrid items={mediaItems} filter={mediaFilter} />
          )}

          {mediasQuery.hasNextPage ? (
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                disabled={mediasQuery.isFetchingNextPage}
                onClick={() => { void mediasQuery.fetchNextPage(); }}
                className="border border-border/70 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
              >
                {mediasQuery.isFetchingNextPage ? "Loading..." : "Load more"}
              </button>
            </div>
          ) : null}
        </>
      ) : null}

      {activeTab === "reviews" ? (
        <>
          {reviewsQuery.isPending ? (
            <div className="border border-border/60 bg-card/30 p-4 text-sm text-muted-foreground">
              Loading liked reviews...
            </div>
          ) : reviewsQuery.isError ? (
            <div className="border border-border/60 bg-card/30 p-4 text-sm text-destructive">
              Could not load liked reviews.
            </div>
          ) : reviewItems.length === 0 ? (
            <ProfileTabEmptyState
              icon={Heart}
              title="No liked reviews yet"
              description="This profile has not liked any reviews yet."
            />
          ) : filteredReviews.length === 0 ? (
            <div className="border px-3 py-2 text-xs profile-shell-border profile-shell-muted profile-shell-panel">
              No {reviewFilter === "all" ? "reviews" : reviewFilter} liked yet.
            </div>
          ) : (
            <div>
              {filteredReviews.map((review) => (
                <LikedReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}

          {reviewsQuery.hasNextPage ? (
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                disabled={reviewsQuery.isFetchingNextPage}
                onClick={() => { void reviewsQuery.fetchNextPage(); }}
                className="border border-border/70 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
              >
                {reviewsQuery.isFetchingNextPage ? "Loading..." : "Load more"}
              </button>
            </div>
          ) : null}
        </>
      ) : null}

      {activeTab === "lists" ? (
        <>
          {listsQuery.isPending ? (
            <div className="border border-border/60 bg-card/30 p-4 text-sm text-muted-foreground">
              Loading liked lists...
            </div>
          ) : listsQuery.isError ? (
            <div className="border border-border/60 bg-card/30 p-4 text-sm text-destructive">
              Could not load liked lists.
            </div>
          ) : listItems.length === 0 ? (
            <ProfileTabEmptyState
              icon={Heart}
              title="No liked lists yet"
              description="This profile has not liked any lists yet."
            />
          ) : filteredLists.length === 0 ? (
            <div className="border px-3 py-2 text-xs profile-shell-border profile-shell-muted profile-shell-panel">
              No {listFilter === "all" ? "lists" : listFilter} liked yet.
            </div>
          ) : (
            <div>
              {filteredLists.map((list) => (
                <LikedListCard key={list.id} list={list} />
              ))}
            </div>
          )}

          {listsQuery.hasNextPage ? (
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                disabled={listsQuery.isFetchingNextPage}
                onClick={() => { void listsQuery.fetchNextPage(); }}
                className="border border-border/70 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
              >
                {listsQuery.isFetchingNextPage ? "Loading..." : "Load more"}
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
};
