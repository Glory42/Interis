import { describe, expect, it } from "bun:test";
import {
  REVIEW_MEDIA_TYPES,
  SEASON_EPISODE_REVIEW_MEDIA_TYPES,
  TV_EPISODE_REVIEW_TYPE,
  TV_SEASON_REVIEW_TYPE,
} from "../../../src/modules/reviews/constants/review-media-type.constant";

describe("REVIEW_MEDIA_TYPES", () => {
  it("covers every value the reviews.mediaType column actually stores", () => {
    expect(REVIEW_MEDIA_TYPES).toEqual(["movie", "tv", "tv_season", "tv_episode"]);
  });

  it("keeps the season/episode subset in sync with the named constants", () => {
    expect(SEASON_EPISODE_REVIEW_MEDIA_TYPES).toEqual([
      TV_SEASON_REVIEW_TYPE,
      TV_EPISODE_REVIEW_TYPE,
    ]);
  });
});
