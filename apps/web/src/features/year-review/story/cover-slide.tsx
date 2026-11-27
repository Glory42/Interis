import type { CoverSlide as CoverSlideData, StoryActions } from "./story.types";
import { StoryPosterPath } from "./story-poster";

type CoverSlideProps = {
  slide: CoverSlideData;
  actions: StoryActions;
};

export const CoverSlide = ({ slide, actions }: CoverSlideProps) => {
  const posters = slide.posterPaths.slice(0, 16);
  return (
    <div className="recap-cover">
      {posters.length > 0 ? (
        <div className="recap-cover-wall" aria-hidden>
          {posters.map((path, index) => (
            <StoryPosterPath key={`${path}-${index}`} path={path} priority={index < 8} />
          ))}
        </div>
      ) : null}
      <div className="recap-cover-scrim" />
      <div className="recap-cover-body">
        <p className="recap-kicker recap-kicker-film">Interis presents</p>
        <h1 className="recap-cover-title">
          {slide.depth === "thin" ? "A short film" : "A year in the dark"}
        </h1>
        <p className="recap-serif">
          {`A private screening for ${slide.user.displayName} · ${slide.year}${
            slide.isPartialYear ? " so far" : ""
          }`}
        </p>
        <button type="button" className="recap-primary" data-story-control onClick={actions.begin}>
          Begin
        </button>
      </div>
      <div className="recap-leader" aria-hidden>
        <span>{slide.depth === "thin" ? "1" : "5"}</span>
      </div>
    </div>
  );
};
