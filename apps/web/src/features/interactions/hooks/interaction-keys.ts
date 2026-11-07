export const interactionKeys = {
  detail: (tmdbId: number) => ["interactions", "movie", tmdbId] as const,
};
