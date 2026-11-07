import type { SeriesWatchStatus } from "../constants/tv-watch-status.constants";

// Status after a regular (non-special) episode or season toggle, derived
// from the viewer's watched-episode count. paused/dropped survive unchecking
// or re-syncing, but checking a new episode means the user is watching again.
export function resolveWatchStatusFromProgress(input: {
  current: SeriesWatchStatus | null;
  watchedEpisodesCount: number;
  totalEpisodes: number | null;
  episodeAdded: boolean;
}): SeriesWatchStatus | null {
  const { current, watchedEpisodesCount, totalEpisodes, episodeAdded } = input;

  if (watchedEpisodesCount <= 0) {
    return null;
  }

  if (totalEpisodes !== null && totalEpisodes > 0 && watchedEpisodesCount >= totalEpisodes) {
    return "completed";
  }

  if ((current === "paused" || current === "dropped") && !episodeAdded) {
    return current;
  }

  return "watching";
}
