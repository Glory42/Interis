// TMDB represents "Specials" as season 0 - excluded from watched-progress
// and season-listing logic across this module (episode filtering, season
// listing, and the archive viewer-progress repository query all need to
// agree on this, or "fully watched" can disagree between them).
export const SPECIALS_SEASON_NUMBER = 0;

export const isNonSpecialSeasonNumber = (seasonNumber: number): boolean =>
  seasonNumber > SPECIALS_SEASON_NUMBER;
