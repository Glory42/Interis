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
  const still = tmdbImageUrl(title.backdropPath ?? title.posterPath, "w780");
  const score = title.rating === null ? null : title.rating.toFixed(1);
  const review = title.review;
  const kind = title.mediaType === "movie" ? "Feature" : "Series";

  return (
    <div className="recap-spotlight">
      {still ? (
        <div
          className="recap-spotlight-bg"
          style={{ backgroundImage: `url(${still})` }}
          aria-hidden
        />
      ) : null}
      <div className="recap-spotlight-beam" aria-hidden />
      <div className="recap-spotlight-scrim" />
      <div className="recap-spotlight-body">
        <p className="recap-kicker recap-kicker-film">The one</p>
        <StoryTitleLink title={title} className="recap-spotlight-link">
          <StoryPoster title={title} size="hero" priority />
        </StoryTitleLink>
        <StoryTitleLink title={title} className="recap-spotlight-title">
          {title.title}
        </StoryTitleLink>
        <div className="recap-spotlight-facts">
          {score ? (
            <p className="recap-spotlight-rating">
              {score} <span>/ 10</span>
            </p>
          ) : null}
          <span className="recap-spotlight-fact">{kind}</span>
          {title.releaseYear ? (
            <span className="recap-spotlight-fact">{title.releaseYear}</span>
          ) : null}
          {title.logCount > 1 ? (
            <span className="recap-spotlight-fact">{`${title.logCount} logs`}</span>
          ) : null}
        </div>
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
            <figure className="recap-spotlight-quote-card">
              <blockquote className="recap-serif">“{review.excerpt}”</blockquote>
              <figcaption>The one that made your year</figcaption>
            </figure>
          )
        ) : null}
      </div>
    </div>
  );
};
