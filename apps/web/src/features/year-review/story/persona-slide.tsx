import type { PersonaSlide as PersonaSlideData } from "./story.types";
import { StoryPosterPath } from "./story-poster";

type PersonaSlideProps = {
  slide: PersonaSlideData;
  username: string;
  year: number;
  onShare: () => void;
};

export const PersonaSlide = ({ slide, username, year, onShare }: PersonaSlideProps) => {
  const persona = slide.persona;

  return (
    <div className="recap-persona">
      <div className="recap-persona-wall" aria-hidden>
        {slide.posterPaths.slice(0, 16).map((path, index) => (
          <StoryPosterPath key={`${path}-${index}`} path={path} priority />
        ))}
      </div>
      <div className="recap-persona-scrim" />
      <div className="recap-persona-body">
        <p className="recap-kicker recap-kicker-film">The verdict</p>
        <p className="recap-kicker">This year, you were</p>
        <h2 className="recap-persona-name">{persona.name}</h2>
        <p className="recap-serif recap-persona-tagline">{persona.tagline}</p>
        <p className="recap-body-copy recap-persona-description">{persona.description}</p>
        <div className="recap-traits">
          {persona.traits.map((trait) => (
            <span key={trait}>{trait}</span>
          ))}
        </div>
        <div className="recap-persona-foot">
          <span>
            {`Based on ${slide.totals.films} films · ${slide.totals.series} series · ${slide.totals.episodes.toLocaleString("en-US")} episodes`}
          </span>
          <span>{`@${username} · ${year}`}</span>
        </div>
        <button
          type="button"
          className="recap-primary"
          data-story-control
          onClick={onShare}
        >
          Share this card
        </button>
      </div>
    </div>
  );
};
