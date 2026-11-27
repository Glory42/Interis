import type { TimeMachineSlide as TimeMachineSlideData } from "./story.types";

const percent = (share: number) => Math.round(share * 100);
const barHeight = (count: number, max: number) => `${Math.round((count / Math.max(max, 1)) * 82)}%`;

export const TimeMachineSlide = ({ slide }: { slide: TimeMachineSlideData }) => {
  if (slide.decades.length === 0) return null;
  const max = Math.max(...slide.decades.map((decade) => decade.count), 1);
  const hot = slide.decades.reduce((best, decade) => (decade.count > best.count ? decade : best));

  return (
    <div className="recap-time">
      <p className="recap-kicker recap-kicker-film">The time machine</p>
      <div className="recap-age">
        <span>{slide.viewingAge}</span>
        <em>your viewing age</em>
      </div>
      <h2 className="recap-statement">{`You watched like it's ${slide.viewingAge}.`}</h2>
      <p className="recap-body-copy">
        {`${percent(slide.pre1980Share)}% of your year was made before 1980.`}
      </p>
      <div className="recap-decades" aria-hidden>
        {slide.decades.map((decade, index) => (
          <div
            key={decade.decade}
            className={
              decade.decade === hot.decade ? "recap-decade recap-decade-hot" : "recap-decade"
            }
          >
            <i
              className="recap-bar"
              style={{ height: barHeight(decade.count, max), animationDelay: `${index * 50}ms` }}
            />
            <em>{`${String(decade.decade).slice(-2)}s`}</em>
          </div>
        ))}
      </div>
      <p className="recap-serif recap-time-foot">{`${percent(slide.pre1980Share)}% before 1980`}</p>
    </div>
  );
};
