import { MEDIA_TYPES } from "../../media/constants/media-type.constant";

// The reviews table's mediaType column carries two values beyond the
// app-wide MediaType (movie/tv): season and episode reviews. Those are
// reviews-specific concepts - CreateReviewDto and every other cross-cutting
// mediaType (interactions, activity, feed) only ever deal in movie/tv, so
// this is scoped here rather than widening MEDIA_TYPES itself, which would
// let those DTOs start accepting values they have no handling for.
export const TV_SEASON_REVIEW_TYPE = "tv_season" as const;
export const TV_EPISODE_REVIEW_TYPE = "tv_episode" as const;

export const SEASON_EPISODE_REVIEW_MEDIA_TYPES = [
  TV_SEASON_REVIEW_TYPE,
  TV_EPISODE_REVIEW_TYPE,
] as const;

export type SeasonEpisodeReviewMediaType = (typeof SEASON_EPISODE_REVIEW_MEDIA_TYPES)[number];

export const REVIEW_MEDIA_TYPES = [...MEDIA_TYPES, ...SEASON_EPISODE_REVIEW_MEDIA_TYPES] as const;

export type ReviewMediaType = (typeof REVIEW_MEDIA_TYPES)[number];
