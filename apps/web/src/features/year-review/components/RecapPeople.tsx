import { Link } from "@tanstack/react-router";
import { GoalBar } from "@/features/profile/components/goal/GoalBar";
import type { YearReview } from "@/features/year-review/api";
import { formatCount, plural } from "@/features/year-review/year-review-model";
import { BigStat, RecapSection } from "./RecapBlocks";

// Reviews written, the most-liked one, Lists created and new followers.
export const RecapPeople = ({ review }: { review: YearReview }) => {
  const { count, mostLiked } = review.reviews;
  if (count === 0 && review.listsCreated === 0 && review.newFollowers === 0) return null;

  const title = count > 0 ? `${plural(count, "review")} written.` : "Out there with the community.";

  return (
    <RecapSection label="Words & people" year={review.year} title={title}>
      <div className="mt-8 grid grid-cols-3 gap-4">
        <BigStat value={formatCount(count)} label={count === 1 ? "review" : "reviews"} />
        <BigStat value={formatCount(review.listsCreated)} label={review.listsCreated === 1 ? "list made" : "lists made"} />
        <BigStat value={formatCount(review.newFollowers)} label={review.newFollowers === 1 ? "new follower" : "new followers"} />
      </div>
      {mostLiked ? (
        <figure className="mt-10 border-l-2 border-primary pl-4">
          <p className="kicker text-muted-foreground">{`Most liked review · ${plural(mostLiked.likeCount, "like")}`}</p>
          <blockquote className="tagline mt-2 text-xl leading-snug text-foreground sm:text-2xl">
            {mostLiked.containsSpoilers ? "Contains spoilers." : `“${mostLiked.excerpt}”`}
          </blockquote>
          <figcaption className="mt-2">
            <Link
              to="/reviews/$username/$reviewId"
              params={{ username: review.user.username, reviewId: mostLiked.id }}
              className="mono-meta text-[11px] text-muted-foreground uppercase hover:text-foreground"
            >
              {`On ${mostLiked.mediaTitle} →`}
            </Link>
          </figcaption>
        </figure>
      ) : null}
    </RecapSection>
  );
};

// How the year's Watch Goal ended (or stands, for the current year).
export const RecapGoal = ({ review }: { review: YearReview }) => {
  const goal = review.goal;
  if (!goal) return null;

  const title = goal.reached
    ? `Goal reached: ${plural(goal.filmsWatched, "film")} against ${formatCount(goal.targetFilms)}.`
    : review.isPartialYear
      ? `${formatCount(goal.filmsWatched)} of ${plural(goal.targetFilms, "film")} so far.`
      : `${formatCount(goal.filmsWatched)} of ${plural(goal.targetFilms, "film")}: close the gap next year.`;

  return (
    <RecapSection label="Watch goal" year={review.year} title={title}>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <GoalBar label="Films" watched={goal.filmsWatched} target={goal.targetFilms} pace={null} tone="film" />
        {goal.targetSeries !== null ? (
          <GoalBar label="Series" watched={goal.seriesWatched} target={goal.targetSeries} pace={null} tone="series" />
        ) : null}
      </div>
    </RecapSection>
  );
};
