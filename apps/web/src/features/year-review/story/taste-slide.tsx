import type { TasteSlide as TasteSlideData } from "./story.types";

export const TasteSlide = ({ slide }: { slide: TasteSlideData }) => {
  const { average, communityAverage, ratedLogs, highRatings, mostRewatched } = slide;
  const delta = average !== null && communityAverage !== null ? average - communityAverage : null;
  const title =
    average === null
      ? "You go back."
      : delta === null
        ? "You have a number."
        : delta > 0.05
          ? "You're a soft touch."
          : delta < -0.05
            ? "You have notes."
            : "You're right on the money.";

  return (
    <div className="recap-taste">
      <p className="recap-kicker recap-kicker-like">The taste</p>
      <h2 className="recap-statement">{title}</h2>
      {average !== null || communityAverage !== null ? (
        <div className="recap-taste-compare">
          {average !== null ? (
            <div>
              <span>{average.toFixed(1)}</span>
              <em>you</em>
            </div>
          ) : null}
          {average !== null && communityAverage !== null ? (
            <span className="recap-vs">vs</span>
          ) : null}
          {communityAverage !== null ? (
            <div>
              <span className="recap-dim">{communityAverage.toFixed(1)}</span>
              <em>the room</em>
            </div>
          ) : null}
        </div>
      ) : null}
      {ratedLogs > 0 ? (
        <p className="recap-body-copy recap-taste-line">
          {`${highRatings} ${highRatings === 1 ? "title" : "titles"} got a 9 or better.`}
        </p>
      ) : null}
      {mostRewatched ? (
        <div className="recap-rewatch">
          <span className="recap-kicker">Most rewatched</span>
          <b>{mostRewatched.title}</b>
          <em>{`×${mostRewatched.logCount}`}</em>
        </div>
      ) : null}
    </div>
  );
};
