import { describe, expect, it } from "bun:test";
import {
  addDays,
  countNewEpisodesSince,
  pickEpisodeAfter,
  planNextEpisodeLookup,
} from "../../../src/modules/tv/helpers/tv-up-next.helper";
import { mapWithConcurrency } from "../../../src/commons/utils/map-with-concurrency";
import type { TMDBSeriesDetail, TMDBSeriesSeasonDetail } from "../../../src/infrastructure/tmdb/tv";

const season = (seasonNumber: number, episodeCount: number, airDate: string | null = null) => ({
  id: seasonNumber,
  season_number: seasonNumber,
  name: `Season ${seasonNumber}`,
  episode_count: episodeCount,
  air_date: airDate,
  poster_path: null,
});

// Out of order, with specials and an empty announced season.
const detail = {
  seasons: [season(2, 4, "2026-11-10"), season(0, 6), season(1, 3, "2025-01-01"), season(3, 0)],
  last_episode_to_air: { id: 1, name: "", season_number: 2, episode_number: 2, air_date: "2026-11-12", still_path: null, runtime: null },
} as unknown as TMDBSeriesDetail;

const seasonDetail = (airDates: (string | null)[]) =>
  ({
    episodes: airDates.map((airDate, index) => ({ episode_number: index + 1, season_number: 1, air_date: airDate })),
  }) as unknown as TMDBSeriesSeasonDetail;

describe("up next helpers", () => {
  it("starts at the first regular season when nothing is watched", () => {
    expect(planNextEpisodeLookup(detail, null)).toEqual([
      { seasonNumber: 1, after: 0 },
      { seasonNumber: 2, after: 0 },
    ]);
  });

  it("skips a finished season and never plans specials or empty seasons", () => {
    expect(planNextEpisodeLookup(detail, { seasonNumber: 1, episodeNumber: 3 })).toEqual([{ seasonNumber: 2, after: 0 }]);
    expect(planNextEpisodeLookup(detail, { seasonNumber: 2, episodeNumber: 4 })).toEqual([]);
  });

  it("picks the first episode after the given one, whatever the list order", () => {
    const picked = pickEpisodeAfter(seasonDetail(["2025-01-01", "2025-01-08", null]), 1);
    expect(picked?.episode_number).toBe(2);
  });

  it("counts aired episodes newer than the last watch, later seasons included", () => {
    const count = countNewEpisodesSince({
      detail,
      season: seasonDetail(["2026-10-01", "2026-11-01", "2026-11-08"]),
      next: { seasonNumber: 1, episodeNumber: 2 },
      lastWatchedDay: "2026-10-15",
      today: "2026-11-16",
    });
    // S1E2 and S1E3, plus the two aired episodes of season 2.
    expect(count).toBe(4);
  });

  it("adds days across month ends", () => {
    expect(addDays("2026-11-25", 14)).toBe("2026-12-09");
  });

  it("maps with bounded concurrency, keeping order", async () => {
    let inFlight = 0;
    let peak = 0;
    const results = await mapWithConcurrency([1, 2, 3, 4, 5], 2, async (value) => {
      inFlight++;
      peak = Math.max(peak, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 5));
      inFlight--;
      return value * 10;
    });
    expect(results).toEqual([10, 20, 30, 40, 50]);
    expect(peak).toBe(2);
  });
});
