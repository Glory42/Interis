export const DEFAULT_FOLLOW_SUGGESTIONS_LIMIT = 15;
export const MAX_FOLLOW_SUGGESTIONS_LIMIT = 20;

// The viewer's most recent watched/rated titles that seed the overlap.
export const SUGGESTION_SEED_TITLES_PER_MEDIA = 200;
// Size of each fallback pool (most followed, most active) when overlap is thin.
export const SUGGESTION_FALLBACK_POOL_SIZE = 50;
// Two ratings this close count as agreeing on a title.
export const SUGGESTION_AGREEMENT_MAX_GAP = 1;
