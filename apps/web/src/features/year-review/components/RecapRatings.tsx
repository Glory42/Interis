import { PosterCard } from "@/components/film/PosterCard";
import { RocketDisplay } from "@/components/film/rating/RocketDisplay";
import type { YearReview } from "@/features/year-review/api";
import { plural } from "@/features/year-review/year-review-model";
import { Fact, RecapSection, RecapTitleLink } from "./RecapBlocks";

// Highest rated titles on the rocket scale, the most rewatched one, and their average
// against the Community Rating of the same titles.
export const RecapRatings = ({ review }: { review: YearReview }) => {
  const { average, communityAverage, ratedLogs } = review.ratings;
  if (ratedLogs === 0 && !review.mostRewatched) return null;

  const title =
    average === null
      ? `${review.mostRewatched?.title} kept coming back.`
      : communityAverage === null || Math.abs(average - communityAverage) < 0.05
        ? `Rated ${average.toFixed(1)} on average.`
        : `Rated ${average.toFixed(1)} on average, ${average > communityAverage ? "kinder" : "tougher"} than the community's ${communityAverage.toFixed(1)}.`;

  return (
    <RecapSection label="Ratings" year={review.year} title={title}>
      {review.topRated.length > 0 ? (
        <div className="mt-8">
          <p className="kicker mb-3 text-muted-foreground">Highest rated</p>
          <ol className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {review.topRated.map((entry) => (
              <li key={`${entry.mediaType}:${entry.tmdbId}`}>
                <PosterCard media={entry} size="S" meta={`${entry.rating.toFixed(1)} / 10`} />
              </li>
            ))}
          </ol>
        </div>
      ) : null}
      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        {average !== null ? (
          <Fact label={`Average · ${plural(ratedLogs, "rated log")}`}>
            <RocketDisplay rating={Math.round(average * 2) / 2} size="sm" />
            <p className="mono-meta mt-1 text-[10px] text-muted-foreground uppercase">{`${average.toFixed(2)} / 10`}</p>
          </Fact>
        ) : null}
        {communityAverage !== null ? (
          <Fact label="Community, same titles">
            <RocketDisplay rating={Math.round(communityAverage * 2) / 2} size="sm" />
            <p className="mono-meta mt-1 text-[10px] text-muted-foreground uppercase">{`${communityAverage.toFixed(2)} / 10`}</p>
          </Fact>
        ) : null}
        {review.mostRewatched ? (
          <Fact label="Most rewatched">
            <RecapTitleLink title={review.mostRewatched} meta={plural(review.mostRewatched.logCount, "watch", "watches")} />
          </Fact>
        ) : null}
      </div>
    </RecapSection>
  );
};
