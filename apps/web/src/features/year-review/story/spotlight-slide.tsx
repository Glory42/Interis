import { Link } from "@tanstack/react-router";
import { tmdbImageUrl } from "@/lib/tmdb-image";
import type { SpotlightSlide as SpotlightSlideData } from "./story.types";
import { StoryPoster } from "./story-poster";
import { StoryTitleLink } from "./story-title-link";

type SpotlightSlideProps = {
  slide: SpotlightSlideData;
  username: string;
};

export const SpotlightSlide = ({ slide, username }: SpotlightSlideProps) => {
  const title = slide.title;
  const background = tmdbImageUrl(title.posterPath, "w500");
  const score = title.rating === null ? null : title.rating.toFixed(1);
  const review = title.review;

  return (
    <div className="recap-spotlight">
      {background ? (
        <div
          className="recap-spotlight-bg"
          style={{ backgroundImage: `url(${background})` }}
          aria-hidden
        />
      ) : null}
      <div className="recap-spotlight-scrim" />
      <div className="recap-spotlight-body">
        <p className="recap-kicker recap-kicker-film">The one</p>
        <StoryTitleLink title={title} className="recap-spotlight-link">
          <StoryPoster title={title} size="hero" priority />
        </StoryTitleLink>
        <StoryTitleLink title={title} className="recap-spotlight-title">
          {title.title}
        </StoryTitleLink>
        <p className="recap-spotlight-rating">
          {score ? (
            <>
              {score} <span>/ 10</span>
            </>
          ) : (
            title.releaseYear
          )}
        </p>
        {review ? (
          review.containsSpoilers ? (
            <Link
              to="/reviews/$username/$reviewId"
              params={{ username, reviewId: review.id }}
              className="recap-text-link"
            >
              Contains spoilers — read it on Interis →
            </Link>
          ) : (
            <p className="recap-serif recap-spotlight-quote">“{review.excerpt}”</p>
          )
        ) : null}
      </div>
    </div>
  );
};
