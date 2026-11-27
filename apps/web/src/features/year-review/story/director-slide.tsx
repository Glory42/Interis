import type { DirectorSlide as DirectorSlideData } from "./story.types";
import { StoryPoster } from "./story-poster";
import { StoryTitleLink } from "./story-title-link";

export const DirectorSlide = ({ slide }: { slide: DirectorSlideData }) => (
  <div className="recap-director">
    <p className="recap-kicker recap-kicker-film">The director</p>
    <h2 className="recap-director-name">{slide.director.director}</h2>
    <p className="recap-director-count">
      <b>{slide.director.count}</b>
      <span>films this year</span>
    </p>
    <div className="recap-director-strip">
      {slide.titles.slice(0, 3).map((title) => (
        <StoryTitleLink
          key={`${title.mediaType}:${title.tmdbId}`}
          title={title}
          className="recap-director-item"
        >
          <StoryPoster title={title} size="grid" />
        </StoryTitleLink>
      ))}
    </div>
    <p className="recap-serif recap-director-line">
      {slide.director.count >= 3 ? "A one-person retrospective." : "A double bill."}
    </p>
  </div>
);
