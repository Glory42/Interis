import { Link } from "@tanstack/react-router";
import type { WordsSlide as WordsSlideData } from "./story.types";

type WordsSlideProps = {
  slide: WordsSlideData;
  username: string;
};

export const WordsSlide = ({ slide, username }: WordsSlideProps) => {
  const review = slide.mostLiked;

  return (
    <div className="recap-words">
      <p className="recap-kicker recap-kicker-like">The words</p>
      <h2 className="recap-statement">
        {`You wrote ${slide.count} ${slide.count === 1 ? "review" : "reviews"}.`}
      </h2>
      {review ? (
        <figure className="recap-quote">
          <blockquote>
            {review.containsSpoilers ? "Contains spoilers." : `“${review.excerpt}”`}
          </blockquote>
          <figcaption>
            {`${review.likeCount} ${review.likeCount === 1 ? "like" : "likes"} · on ${review.mediaTitle}`}
          </figcaption>
          <Link
            to="/reviews/$username/$reviewId"
            params={{ username, reviewId: review.id }}
            className="recap-text-link"
          >
            Read the review →
          </Link>
        </figure>
      ) : null}
      <div className="recap-words-stats">
        <div>
          <b>{slide.listsCreated}</b>
          <span>lists</span>
        </div>
        <div>
          <b>{slide.newFollowers}</b>
          <span>new followers</span>
        </div>
        <div>
          <b>{slide.count}</b>
          <span>reviews</span>
        </div>
      </div>
    </div>
  );
};
