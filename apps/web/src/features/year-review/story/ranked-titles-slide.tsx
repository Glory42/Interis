import type { RankedTitlesSlide as RankedTitlesSlideData } from "./story.types";
import { StoryPoster } from "./story-poster";
import { StoryTitleLink } from "./story-title-link";

const headingFor = (scope: RankedTitlesSlideData["scope"]) =>
  scope === "series" ? "And the one you binged." : scope === "mixed" ? "The year in titles." : "The five that stayed.";

const kickerFor = (scope: RankedTitlesSlideData["scope"]) =>
  scope === "series" ? "The series" : scope === "mixed" ? "The year" : "The five";

const unitFor = (scope: RankedTitlesSlideData["scope"]) =>
  scope === "series" ? "series" : scope === "mixed" ? "titles" : "films";

const scoreOf = (title: RankedTitlesSlideData["titles"][number]) =>
  title.rating === null ? null : title.rating.toFixed(1);

type RankedTitlesSlideProps = {
  slide: RankedTitlesSlideData;
};

export const RankedTitlesSlide = ({ slide }: RankedTitlesSlideProps) => {
  const [hero, ...rest] = slide.titles;
  if (!hero) return null;

  return (
    <div className="recap-ranked">
      <p
        className={`recap-kicker ${
          slide.scope === "series" ? "recap-kicker-series" : "recap-kicker-film"
        }`}
      >
        {kickerFor(slide.scope)}
      </p>
      <h2 className="recap-statement">{headingFor(slide.scope)}</h2>
      <div className="recap-ranked-layout">
        <StoryTitleLink title={hero} className="recap-ranked-hero">
          <StoryPoster title={hero} size="hero" priority />
          <span className="recap-ranked-meta">
            <b>1</b>
            <span className="recap-ranked-name">
              {hero.title}
              {hero.releaseYear ? <small>{hero.releaseYear}</small> : null}
            </span>
            {scoreOf(hero) ? <em>{scoreOf(hero)}</em> : null}
          </span>
        </StoryTitleLink>
        {rest.length > 0 ? (
          <div className="recap-ranked-grid">
            {rest.slice(0, 4).map((title, index) => (
              <StoryTitleLink
                key={`${title.mediaType}:${title.tmdbId}`}
                title={title}
                className="recap-ranked-item"
              >
                <StoryPoster title={title} size="grid" />
                <span className="recap-ranked-meta">
                  <b>{index + 2}</b>
                  <span className="recap-ranked-name">
                    {title.title}
                    {title.releaseYear ? <small>{title.releaseYear}</small> : null}
                  </span>
                  {scoreOf(title) ? <em>{scoreOf(title)}</em> : null}
                </span>
              </StoryTitleLink>
            ))}
          </div>
        ) : null}
      </div>
      <p className="recap-receipt">
        {`Ranked by your rating · ${slide.totalWatched.toLocaleString("en-US")} ${unitFor(slide.scope)} watched`}
      </p>
    </div>
  );
};
