export type UpNextSeries = {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
};

export type UpNextEpisode = {
  seasonNumber: number;
  episodeNumber: number;
  name: string;
  stillPath: string | null;
  airDate: string | null;
  runtime: number | null;
};

export type UpNextItem = {
  series: UpNextSeries;
  episode: UpNextEpisode;
  seasonEpisodeCount: number | null;
  watchedEpisodesCount: number;
  numberOfEpisodes: number | null;
  lastWatchedAt: string | null;
  // Aired episodes from this one on that premiered after the viewer's last watch.
  newEpisodesCount: number;
};

export type AiringSoonEpisode = {
  series: UpNextSeries;
  episode: UpNextEpisode;
  source: "watching" | "watchlist";
};

export type UpNextResponse = {
  today: string;
  upNext: UpNextItem[];
  airingSoon: { date: string; episodes: AiringSoonEpisode[] }[];
};
