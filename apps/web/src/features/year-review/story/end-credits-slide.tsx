import { Link } from "@tanstack/react-router";
import type { EndSlide as EndSlideData } from "./story.types";

type EndCreditsSlideProps = {
  slide: EndSlideData;
  username: string;
  year: number;
  isOwner: boolean;
  isLoggedIn: boolean;
  onShare: () => void;
  onReplay: () => void;
};

const goalText = (slide: EndSlideData) => {
  const goal = slide.goal;
  if (!goal) return null;
  const parts: string[] = [];
  if (goal.targetFilms !== null) parts.push(`${goal.filmsWatched}/${goal.targetFilms} F`);
  if (goal.targetSeries !== null) parts.push(`${goal.seriesWatched}/${goal.targetSeries} TV`);
  return parts.length > 0 ? parts.join(" · ") : null;
};

export const EndCreditsSlide = ({
  slide,
  username,
  year,
  isOwner,
  isLoggedIn,
  onShare,
  onReplay,
}: EndCreditsSlideProps) => {
  const goal = goalText(slide);

  return (
    <div className="recap-end">
      <p className="recap-kicker">End credits</p>
      <h2 className="recap-statement recap-end-title">That's a wrap.</h2>
      <div className="recap-credits">
        <div><span>Films</span><i /><b>{slide.totals.films.toLocaleString("en-US")}</b></div>
        <div><span>Series</span><i /><b>{slide.totals.series.toLocaleString("en-US")}</b></div>
        <div><span>Episodes</span><i /><b>{slide.totals.episodes.toLocaleString("en-US")}</b></div>
        <div><span>Hours</span><i /><b>{slide.totals.hoursWatched.toLocaleString("en-US")}</b></div>
        {goal ? <div><span>Goal</span><i /><b>{goal}</b></div> : null}
      </div>
      <p className="recap-serif recap-end-line">
        {slide.isPartialYear ? "The year isn't over. Keep logging." : `See you in ${year + 1}.`}
      </p>
      <div className="recap-end-actions">
        <button type="button" className="recap-primary" data-story-control onClick={onShare}>
          Share your year
        </button>
        {isOwner ? (
          <>
            <Link
              to="/profile/$username/year/$year"
              params={{ username, year: String(year) }}
              className="recap-secondary"
            >
              Full breakdown
            </Link>
            <Link to="/movies" className="recap-secondary">
              Log a film
            </Link>
          </>
        ) : isLoggedIn ? (
          <Link to="/profile/$username" params={{ username }} className="recap-secondary">
            Back to profile
          </Link>
        ) : (
          <Link to="/" className="recap-secondary">
            Start your journal
          </Link>
        )}
        <button type="button" className="recap-secondary" data-story-control onClick={onReplay}>
          Replay
        </button>
      </div>
    </div>
  );
};
