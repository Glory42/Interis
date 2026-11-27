import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { StatsSkeleton } from "@/components/ui/PageSkeletons";
import { useIsOwnProfile } from "@/features/profile/hooks/useProfile";
import { useYearReview } from "@/features/year-review/hooks/useYearReview";
import type { YearReview } from "@/features/year-review/api";
import { formatDay, selectableYears } from "@/features/year-review/year-review-model";
import { RecapHero } from "@/features/year-review/components/RecapHero";
import { RecapRhythm } from "@/features/year-review/components/RecapRhythm";
import { RecapTaste } from "@/features/year-review/components/RecapTaste";
import { RecapRatings } from "@/features/year-review/components/RecapRatings";
import { RecapGoal, RecapPeople } from "@/features/year-review/components/RecapPeople";
import { Fact, RecapSection, RecapTitleLink } from "@/features/year-review/components/RecapBlocks";
import { RecapShareButton } from "@/features/year-review/components/RecapShareButton";
import { RecapYearSelector } from "@/features/year-review/components/RecapYearSelector";
import { isApiError } from "@/lib/api-client";
import { recapShareText } from "@/lib/share-meta";

type YearReviewPageProps = { username: string; year: number; now?: Date };

// A thin year's short version: what they watched, without charts of near-empty months.
const RecapThin = ({ review }: { review: YearReview }) => {
  const titles = [review.firstWatch, ...review.topRated, review.lastWatch].filter((title) => title !== null);
  const seen = new Set<string>();
  const unique = titles.filter((title) => {
    const key = `${title.mediaType}:${title.tmdbId}`;
    return seen.has(key) ? false : (seen.add(key), true);
  });

  return (
    <RecapSection label="The year in titles" year={review.year} title={review.isPartialYear ? "A quiet start." : "A quiet year."}>
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {unique.slice(0, 4).map((title) => (
          <Fact key={`${title.mediaType}:${title.tmdbId}`} label={"watchedDate" in title ? formatDay(title.watchedDate) : "Highly rated"}>
            <RecapTitleLink title={title} meta={"rating" in title ? `${title.rating.toFixed(1)} / 10` : null} />
          </Fact>
        ))}
      </div>
    </RecapSection>
  );
};

export const YearReviewPage = ({ username, year, now: nowProp }: YearReviewPageProps) => {
  const now = nowProp ?? new Date();
  const isOwner = useIsOwnProfile(username);
  const query = useYearReview(username, year);

  if (query.isPending) return <StatsSkeleton />;
  if (query.isError) {
    return (
      <p className="body-s text-muted-foreground">
        {isApiError(query.error) && query.error.status === 404 ? "This year in review isn't available." : "Could not load this year right now."}
      </p>
    );
  }

  const review = query.data;
  const actions = (
    <>
      <Button variant="primary" size="md" asChild>
        <Link
          to="/recap/$username/$year"
          params={{ username: review.user.username, year: String(review.year) }}
        >
          Play the recap
        </Link>
      </Button>
      <RecapShareButton username={review.user.username} year={review.year} title={recapShareText(review).title} />
      <RecapYearSelector username={review.user.username} years={selectableYears(review, now)} activeYear={review.year} />
    </>
  );

  return (
    <article aria-label={`${review.user.displayName}'s ${review.year} in review`}>
      <RecapHero review={review} isOwner={isOwner} actions={actions} />
      {review.depth === "full" ? (
        <>
          <RecapRhythm review={review} now={now} />
          <RecapTaste review={review} />
          <RecapRatings review={review} />
          <RecapPeople review={review} />
        </>
      ) : null}
      {review.depth === "thin" ? <RecapThin review={review} /> : null}
      <RecapGoal review={review} />
    </article>
  );
};
