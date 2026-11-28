import { StoryPosterPath } from "./story-poster";

type StoryPosterStripProps = {
  posterPaths: string[];
  count?: number;
};

// A small fan of the year's posters, used where a card has room to show the
// actual films instead of another number.
export const StoryPosterStrip = ({ posterPaths, count = 5 }: StoryPosterStripProps) => {
  const posters = posterPaths.filter((path): path is string => Boolean(path)).slice(0, count);
  if (posters.length === 0) return null;

  return (
    <div className="recap-strip" aria-hidden>
      {posters.map((path, index) => (
        <StoryPosterPath key={`${path}-${index}`} path={path} priority />
      ))}
    </div>
  );
};
