import { Link } from "@tanstack/react-router";
import type { EmptySlide as EmptySlideData } from "./story.types";

type EmptySlideProps = {
  slide: EmptySlideData;
  isOwner: boolean;
};

export const EmptySlide = ({ slide, isOwner }: EmptySlideProps) => (
  <div className="recap-empty">
    <p className="recap-kicker">A quiet year</p>
    <h2 className="recap-statement recap-empty-title">A quiet year.</h2>
    <p className="recap-body-copy">{`Nothing logged in ${slide.year}. The screen is still dark.`}</p>
    <div className="recap-empty-actions">
      {isOwner ? (
        <Link to="/movies" className="recap-primary">
          Log a film
        </Link>
      ) : (
        <Link to="/" className="recap-primary">
          Start your journal
        </Link>
      )}
      {!isOwner ? (
        <Link
          to="/profile/$username/year/$year"
          params={{ username: slide.user.username, year: String(slide.year) }}
          className="recap-secondary"
        >
          See the stats
        </Link>
      ) : null}
    </div>
  </div>
);
