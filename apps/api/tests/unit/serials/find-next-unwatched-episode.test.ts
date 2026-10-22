import { describe, expect, it } from "bun:test";
import { findNextUnwatchedEpisode } from "../../../src/modules/serials/helpers/serials-tracking.helper";
import type { TMDBSeriesDetail } from "../../../src/infrastructure/tmdb/serials";

const season = (seasonNumber: number, episodeCount: number) => ({
  id: seasonNumber,
  season_number: seasonNumber,
  name: `Season ${seasonNumber}`,
  episode_count: episodeCount,
  air_date: null,
  poster_path: null,
});

// Seasons listed out of order, with specials, to check sorting and filtering.
const detail = {
  seasons: [season(2, 2), season(0, 3), season(1, 2)],
} as unknown as TMDBSeriesDetail;

describe("findNextUnwatchedEpisode", () => {
  it("returns the first regular episode when nothing is watched, ignoring specials", () => {
    expect(findNextUnwatchedEpisode(detail, new Set())).toEqual({
      seasonNumber: 1,
      episodeNumber: 1,
      name: "Episode 1",
    });
  });

  it("skips watched episodes across season boundaries in air order", () => {
    expect(findNextUnwatchedEpisode(detail, new Set(["1:1", "1:2", "2:1"]))).toEqual({
      seasonNumber: 2,
      episodeNumber: 2,
      name: "Episode 2",
    });
  });

  it("returns null when every regular episode is watched or TMDB detail is missing", () => {
    expect(findNextUnwatchedEpisode(detail, new Set(["1:1", "1:2", "2:1", "2:2"]))).toBeNull();
    expect(findNextUnwatchedEpisode(null, new Set())).toBeNull();
  });
});
