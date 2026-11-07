import { toReelCounterLabel } from "@/features/serials/components/serial-detail/utils";

type SeasonsHeadingProps = {
  watchedEpisodes: number;
  totalEpisodes: number | null;
  nextUp: { seasonNumber: number; episodeNumber: number } | null;
};

// "Seasons" with one reel counter for the whole series.
export const SeasonsHeading = ({ watchedEpisodes, totalEpisodes, nextUp }: SeasonsHeadingProps) => {
  const counter = toReelCounterLabel(watchedEpisodes, totalEpisodes, nextUp);

  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[color:var(--line)] pb-2">
      <h2 className="display-3 text-foreground">Seasons</h2>
      {counter ? <p className="mono-meta uppercase text-muted-foreground">{counter}</p> : null}
    </div>
  );
};
