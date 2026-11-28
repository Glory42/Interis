import { useEffect, useState } from "react";
import { StoryPosterStrip } from "./story-poster-strip";
import type { StoryActions, VolumeSlide as VolumeSlideData } from "./story.types";

const useCountUp = (target: number, reduced: boolean) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (reduced) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 900);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduced, target]);

  return reduced ? target : value;
};

const comparisonFor = (slide: VolumeSlideData) => {
  const previous = slide.previousYear;
  if (!previous || previous.hoursWatched <= 0 || slide.totals.hoursWatched === previous.hoursWatched) {
    return null;
  }
  const diff = Math.round(
    ((slide.totals.hoursWatched - previous.hoursWatched) / previous.hoursWatched) * 100,
  );
  return `${diff > 0 ? "↑" : "↓"} ${Math.abs(diff)}% vs ${slide.year - 1}`;
};

type VolumeSlideProps = {
  slide: VolumeSlideData;
  actions: StoryActions;
  posterPaths?: string[];
};

export const VolumeSlide = ({ slide, actions, posterPaths = [] }: VolumeSlideProps) => {
  const hours = slide.totals.hoursWatched;
  const value = useCountUp(hours, actions.reducedMotion);
  const days = (hours / 24).toFixed(1);
  const comparison = comparisonFor(slide);

  return (
    <div className="recap-volume">
      <p className="recap-kicker recap-kicker-film">The volume</p>
      <div className="recap-big-number" data-digits={String(hours).length}>
        <span>{value.toLocaleString("en-US")}</span>
        <em>hours</em>
      </div>
      <div className="recap-volume-rule" aria-hidden />
      <p className="recap-statement recap-volume-statement">
        That's <b>{days} days</b> in other worlds{slide.isPartialYear ? " so far" : ""}.
      </p>
      <div className="recap-stat-row">
        <div className="film">
          <b>{slide.totals.films.toLocaleString("en-US")}</b>
          <span>films</span>
        </div>
        <div className="series">
          <b>{slide.totals.series.toLocaleString("en-US")}</b>
          <span>series</span>
        </div>
        <div>
          <b>{slide.totals.episodes.toLocaleString("en-US")}</b>
          <span>episodes</span>
        </div>
      </div>
      {comparison ? <p className="recap-pill">{comparison}</p> : null}
      <StoryPosterStrip posterPaths={posterPaths} />
    </div>
  );
};
