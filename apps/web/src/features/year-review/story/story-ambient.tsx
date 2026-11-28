import { tmdbImageUrl } from "@/lib/tmdb-image";
import { StoryPosterPath } from "./story-poster";

type StoryAmbientProps = {
  backdropPath: string | null;
  posterPaths: string[];
};

// The room behind the data cards: the year's poster wall, the top title's
// backdrop and a projector beam, all washed in the active theme.
export const StoryAmbient = ({ backdropPath, posterPaths }: StoryAmbientProps) => {
  const still = tmdbImageUrl(backdropPath, "w780");
  const posters = posterPaths.filter((path): path is string => Boolean(path)).slice(0, 20);

  return (
    <div className="recap-ambient" aria-hidden>
      {still ? (
        <div className="recap-ambient-still" style={{ backgroundImage: `url(${still})` }} />
      ) : null}
      {posters.length > 0 ? (
        <div className="recap-ambient-wall">
          {posters.map((path, index) => (
            <StoryPosterPath key={`${path}-${index}`} path={path} priority />
          ))}
        </div>
      ) : null}
      <div className="recap-ambient-beam" />
      <div className="recap-ambient-scrim" />
    </div>
  );
};
