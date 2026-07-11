// Parses the compound mediaSourceId used for season/episode reviews and
// interactions: "{tmdbId}:{seasonNumber}" or "{tmdbId}:{seasonNumber}:{episodeNumber}".
export const parseSeasonMediaSourceId = (
  mediaSourceId: string,
): { tmdbId: number; seasonNumber: number } | null => {
  const [tmdbIdPart, seasonPart] = mediaSourceId.split(":");
  const tmdbId = Number(tmdbIdPart);
  const seasonNumber = Number(seasonPart);
  return Number.isInteger(tmdbId) && Number.isInteger(seasonNumber)
    ? { tmdbId, seasonNumber }
    : null;
};

export const parseEpisodeMediaSourceId = (
  mediaSourceId: string,
): { tmdbId: number; seasonNumber: number; episodeNumber: number } | null => {
  const [tmdbIdPart, seasonPart, episodePart] = mediaSourceId.split(":");
  const tmdbId = Number(tmdbIdPart);
  const seasonNumber = Number(seasonPart);
  const episodeNumber = Number(episodePart);
  return Number.isInteger(tmdbId) && Number.isInteger(seasonNumber) && Number.isInteger(episodeNumber)
    ? { tmdbId, seasonNumber, episodeNumber }
    : null;
};
