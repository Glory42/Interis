import type { GenreSlide as GenreSlideData } from "./story.types";
import { StoryPosterStrip } from "./story-poster-strip";

const percent = (share: number) => `${Math.round(share * 100)}%`;

type GenreSlideProps = {
  slide: GenreSlideData;
  posterPaths?: string[];
};

export const GenreSlide = ({ slide, posterPaths = [] }: GenreSlideProps) => {
  const top = slide.genres[0];
  if (!top) return null;

  return (
    <div className="recap-genre">
      <p className="recap-kicker">The type</p>
      <h2 className="recap-genre-word">{top.genre}</h2>
      <p className="recap-statement">{percent(top.share)} of everything you watched.</p>
      <StoryPosterStrip posterPaths={posterPaths} />
      <div className="recap-genre-rows">
        {slide.genres.slice(0, 3).map((genre) => (
          <div key={genre.genre} className="recap-genre-row">
            <span>{genre.genre}</span>
            <b>{percent(genre.share)}</b>
          </div>
        ))}
      </div>
    </div>
  );
};
