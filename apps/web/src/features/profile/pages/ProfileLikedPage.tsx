import { LoadingRegion, TitleRowsSkeleton } from "@/components/ui/PageSkeletons";
import { useMemo, useState } from "react";
import { ProfileTabEmptyState } from "@/features/profile/components/ProfileTabEmptyState";
import { LikedMediaGrid, type MediaFilter } from "@/features/profile/components/LikedMediaGrid";
import { LikedListCard } from "@/features/profile/components/LikedListCard";
import { LikedReviewCard } from "@/features/profile/components/LikedReviewCard";
import { ProfileMediaGridSkeleton } from "@/features/profile/components/ProfileMediaGridSkeleton";
import {
  mediaShelfCount,
  mediaShelfOptions,
  toMediaShelfType,
} from "@/features/profile/components/media-shelf-filter";
import { SentenceSelect, type SentenceOption } from "@/components/ui/SentenceSelect";
import {
  useUserLikedFilms,
  useUserLikedLists,
  useUserLikedReviews,
  useIsOwnProfile,
} from "@/features/profile/hooks/useProfile";

type LikedTab = "medias" | "reviews" | "lists";
type ListFilter = "all" | "movie" | "serial" | "mixed";

const topTabs: Array<SentenceOption<LikedTab>> = [
  { value: "medias", word: "titles", label: "Titles" },
  { value: "reviews", word: "reviews", label: "Reviews" },
  { value: "lists", word: "lists", label: "Lists" },
];

const listSubFilters: Array<SentenceOption<ListFilter>> = [
  { value: "all", word: "every kind", label: "Every kind" },
  { value: "movie", word: "film lists", label: "Film lists" },
  { value: "serial", word: "series lists", label: "Series lists" },
  { value: "mixed", word: "mixed lists", label: "Mixed lists" },
];

type ProfileLikedPageProps = {
  username: string;
};

export const ProfileLikedPage = ({ username }: ProfileLikedPageProps) => {
  const [activeTab, setActiveTab] = useState<LikedTab>("medias");
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>("all");
  const [reviewFilter, setReviewFilter] = useState<MediaFilter>("all");
  const [listFilter, setListFilter] = useState<ListFilter>("all");

  const mediasQuery = useUserLikedFilms(username, toMediaShelfType(mediaFilter));
  const isOwner = useIsOwnProfile(username);
  const reviewsQuery = useUserLikedReviews(username);
  const listsQuery = useUserLikedLists(username);

  const mediaItems = mediasQuery.data?.items ?? [];
  const mediaCounts = mediasQuery.data?.counts ?? { movie: 0, tv: 0 };
  const mediaTotal = mediaShelfCount("all", mediaCounts);
  const mediaSubFilters = mediaShelfOptions(mediaCounts);
  const reviewSubFilters = mediaShelfOptions();
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
    if (reviewFilter === "movie") return reviewItems.filter((r) => r.mediaType === "movie");
    return reviewItems.filter((r) => r.mediaType === "tv");
  }, [reviewItems, reviewFilter]);

  const filteredLists = useMemo(() => {
    if (listFilter === "all") return listItems;
    if (listFilter === "mixed") return listItems.filter((l) => !l.derivedType || l.derivedType === "mixed");
    return listItems.filter((l) => l.derivedType === listFilter);
  }, [listItems, listFilter]);

  const countByTab: Record<LikedTab, number | undefined> = {
    medias: mediasQuery.isPending ? undefined : mediaShelfCount(mediaFilter, mediaCounts),
    reviews: reviewsQuery.isPending ? undefined : filteredReviews.length,
    lists: listsQuery.isPending ? undefined : filteredLists.length,
  };

  const activeSubFilters =
    activeTab === "medias"
      ? <SentenceSelect value={mediaFilter} options={mediaSubFilters} onChange={setMediaFilter} />
      : activeTab === "reviews"
        ? <SentenceSelect value={reviewFilter} options={reviewSubFilters} onChange={setReviewFilter} />
        : <SentenceSelect value={listFilter} options={listSubFilters} onChange={setListFilter} />;

  return (
    <div>
      <p className="body-s mb-4 text-muted-foreground">
        {countByTab[activeTab] !== undefined ? `Showing ${countByTab[activeTab]} liked ` : "Showing liked "}
        <SentenceSelect value={activeTab} options={topTabs} onChange={setActiveTab} />
        {" · "}
        {activeSubFilters}
        {"."}
      </p>

      {/* Content */}
      {activeTab === "medias" ? (
        <>
          {mediasQuery.isPending ? (
            <ProfileMediaGridSkeleton label="Loading liked titles" />
          ) : mediasQuery.isError ? (
            <div className="rounded-lg border border-border/60 bg-card/30 p-4 text-sm text-destructive">
              Could not load liked media.
            </div>
          ) : mediaTotal === 0 ? (
            <ProfileTabEmptyState isOwner={isOwner} visitorText="No likes yet." ownerText="♥ any title to keep it here." />
          ) : (
            <LikedMediaGrid items={mediaItems} filter={mediaFilter} />
          )}

          {mediasQuery.hasNextPage ? (
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                disabled={mediasQuery.isFetchingNextPage}
                onClick={() => { void mediasQuery.fetchNextPage(); }}
                className="rounded-full border border-border/70 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
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
            <LoadingRegion label="Loading liked reviews">
              <TitleRowsSkeleton count={3} />
            </LoadingRegion>
          ) : reviewsQuery.isError ? (
            <div className="rounded-lg border border-border/60 bg-card/30 p-4 text-sm text-destructive">
              Could not load liked reviews.
            </div>
          ) : reviewItems.length === 0 ? (
            <ProfileTabEmptyState isOwner={isOwner} visitorText="No liked reviews yet." />
          ) : filteredReviews.length === 0 ? (
            <div className="border px-3 py-2 text-xs shell-border shell-muted surface">
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
                className="rounded-full border border-border/70 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
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
            <LoadingRegion label="Loading liked lists">
              <TitleRowsSkeleton count={3} />
            </LoadingRegion>
          ) : listsQuery.isError ? (
            <div className="rounded-lg border border-border/60 bg-card/30 p-4 text-sm text-destructive">
              Could not load liked lists.
            </div>
          ) : listItems.length === 0 ? (
            <ProfileTabEmptyState isOwner={isOwner} visitorText="No liked lists yet." />
          ) : filteredLists.length === 0 ? (
            <div className="border px-3 py-2 text-xs shell-border shell-muted surface">
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
                className="rounded-full border border-border/70 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
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
