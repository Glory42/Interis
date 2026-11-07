import { LoadingRegion, TitleRowsSkeleton } from "@/components/ui/PageSkeletons";
import { ProfileTabEmptyState } from "@/features/profile/components/ProfileTabEmptyState";
import { ProfileReviewRow } from "@/features/profile/components/ProfileReviewRow";
import { useIsOwnProfile, useUserProfile, useUserReviews } from "@/features/profile/hooks/useProfile";

type ProfileReviewsPageProps = {
  username: string;
};

export const ProfileReviewsPage = ({ username }: ProfileReviewsPageProps) => {
  const reviewsQuery = useUserReviews(username);
  const isOwner = useIsOwnProfile(username);
  const reviews = reviewsQuery.data?.pages.flat() ?? [];
  // The profile (already loaded by the layout) carries the real total, not just this page.
  const totalReviews = useUserProfile(username).data?.stats?.reviewCount;

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
          <p className="body-s mb-1 text-muted-foreground">
            {`Showing all ${(totalReviews ?? reviews.length).toLocaleString("en-US")} reviews, newest first.`}
          </p>
          {reviews.map((entry) => (
            <ProfileReviewRow key={entry.id} review={entry} username={username} />
          ))}
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
