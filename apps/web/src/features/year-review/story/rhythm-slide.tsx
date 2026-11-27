import { MONTH_NAMES, formatDay, plural } from "../year-review-model";
import type { RhythmSlide as RhythmSlideData } from "./story.types";

const barHeight = (count: number, max: number) => `${Math.round((count / Math.max(max, 1)) * 82)}%`;

export const RhythmSlide = ({ slide }: { slide: RhythmSlideData }) => {
  const max = Math.max(...slide.months.map((month) => month.count), 1);
  const busiest = slide.busiestMonth;
  const title = busiest ? `${MONTH_NAMES[busiest.month - 1]} was your season.` : "A year in logs.";

  return (
    <div className="recap-rhythm">
      <p className="recap-kicker recap-kicker-film">The rhythm</p>
      <h2 className="recap-statement">{title}</h2>
      <div className="recap-months" aria-hidden>
        {slide.months.map((month, index) => (
          <div
            key={month.month}
            className={busiest?.month === month.month ? "recap-month recap-month-hot" : "recap-month"}
          >
            <i
              className="recap-bar"
              style={{ height: barHeight(month.count, max), animationDelay: `${index * 35}ms` }}
            />
            <em>{MONTH_NAMES[month.month - 1]?.slice(0, 1)}</em>
          </div>
        ))}
      </div>
      <div className="recap-rhythm-stats">
        {slide.longestStreak ? (
          <div>
            <b>{plural(slide.longestStreak.days, "day")}</b>
            <span>streak</span>
          </div>
        ) : null}
        {slide.busiestDay ? (
          <div>
            <b>{slide.busiestDay.count}</b>
            <span>{`${slide.busiestDay.count === 1 ? "film" : "films"} on ${formatDay(slide.busiestDay.day)}`}</span>
          </div>
        ) : null}
      </div>
      {slide.longestStreak ? (
        <p className="recap-receipt">
          {`${formatDay(slide.longestStreak.start)} – ${formatDay(slide.longestStreak.end)}`}
        </p>
      ) : null}
    </div>
  );
};
