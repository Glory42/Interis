import { LoadingRegion, TitleRowsSkeleton } from "@/components/ui/PageSkeletons";
import { useMemo, useState } from "react";
import { SentenceSelect } from "@/components/ui/SentenceSelect";
import { ProfileTabEmptyState } from "@/features/profile/components/ProfileTabEmptyState";
import { ProfileReviewRow } from "@/features/profile/components/ProfileReviewRow";
import {
  mediaShelfOptions,
  toMediaShelfType,
  type MediaShelfFilter,
} from "@/features/profile/components/media-shelf-filter";
import { useIsOwnProfile, useUserProfile, useUserReviews } from "@/features/profile/hooks/useProfile";

type ProfileReviewsPageProps = {
  username: string;
};

export const ProfileReviewsPage = ({ username }: ProfileReviewsPageProps) => {
  const [filter, setFilter] = useState<MediaShelfFilter>("all");
  const reviewsQuery = useUserReviews(username);
  const isOwner = useIsOwnProfile(username);
  const reviews = useMemo(() => reviewsQuery.data?.pages.flat() ?? [], [reviewsQuery.data]);
  // The profile (already loaded by the layout) carries the real total, not just this page.
  const totalReviews = useUserProfile(username).data?.stats?.reviewCount;

  const filteredReviews = useMemo(() => {
    if (filter === "all") return reviews;
    const mediaType = toMediaShelfType(filter);
    return reviews.filter((review) => review.mediaType === mediaType);
  }, [reviews, filter]);

  return (
    <>
      {reviewsQuery.isPending ? (
        <LoadingRegion label="Loading reviews">
          <TitleRowsSkeleton count={4} />
        </LoadingRegion>
      ) : null}

      {reviewsQuery.isError ? (
        <p className="body-s text-[color:var(--danger)]">Could not load reviews.</p>
      ) : null}

      {!reviewsQuery.isPending && !reviewsQuery.isError && reviews.length === 0 ? (
        <ProfileTabEmptyState
          isOwner={isOwner}
          visitorText="No reviews yet."
          ownerAction={{ label: "Find something to review →", to: "/movies" }}
        />
      ) : null}

      {reviews.length > 0 ? (
        <section aria-label="Reviews">
          <p className="body-s mb-4 text-muted-foreground">
            {filter === "all"
              ? `Showing all ${(totalReviews ?? reviews.length).toLocaleString("en-US")} reviews`
              : `Showing ${filteredReviews.length.toLocaleString("en-US")} reviews`}
            {" · "}
            <SentenceSelect
              value={filter}
              options={mediaShelfOptions()}
              onChange={setFilter}
              ariaLabel="Filter reviews by media type"
            />
            {"."}
          </p>

          {filteredReviews.length === 0 ? (
            <p className="body-s text-muted-foreground">
              {`No ${filter === "movie" ? "film" : "series"} reviews yet.`}
            </p>
          ) : (
            filteredReviews.map((entry) => (
              <ProfileReviewRow key={entry.id} review={entry} username={username} />
            ))
          )}
        </section>
      ) : null}

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
  );
};
