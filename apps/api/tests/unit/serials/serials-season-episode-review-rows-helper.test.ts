import { describe, expect, it } from "bun:test";
import { splitSeasonEpisodeReviewRows } from "../../../src/modules/serials/helpers/serials-season-episode-review-rows.helper";

type Row = { id: string; mediaType: string; mediaSourceId: string };

describe("splitSeasonEpisodeReviewRows", () => {
  it("splits season and episode reviews into separate groups with parsed ids", () => {
    const rows: Row[] = [
      { id: "s1", mediaType: "tv_season", mediaSourceId: "42:1" },
      { id: "e1", mediaType: "tv_episode", mediaSourceId: "42:1:3" },
    ];

    const { seasonRows, episodeRows } = splitSeasonEpisodeReviewRows(rows);

    expect(seasonRows).toEqual([
      { id: "s1", mediaType: "tv_season", mediaSourceId: "42:1", parsed: { tmdbId: 42, seasonNumber: 1 } },
    ]);
    expect(episodeRows).toEqual([
      {
        id: "e1",
        mediaType: "tv_episode",
        mediaSourceId: "42:1:3",
        parsed: { tmdbId: 42, seasonNumber: 1, episodeNumber: 3 },
      },
    ]);
  });

  it("drops a row whose mediaSourceId doesn't parse instead of throwing", () => {
    const rows: Row[] = [{ id: "bad", mediaType: "tv_season", mediaSourceId: "not-a-valid-id" }];

    const { seasonRows, episodeRows } = splitSeasonEpisodeReviewRows(rows);

    expect(seasonRows).toEqual([]);
    expect(episodeRows).toEqual([]);
  });

  it("ignores rows of any other mediaType", () => {
    const rows: Row[] = [{ id: "movie-review", mediaType: "movie", mediaSourceId: "42" }];

    const { seasonRows, episodeRows } = splitSeasonEpisodeReviewRows(rows);

    expect(seasonRows).toEqual([]);
    expect(episodeRows).toEqual([]);
  });

  it("returns empty groups for an empty input", () => {
    expect(splitSeasonEpisodeReviewRows([])).toEqual({ seasonRows: [], episodeRows: [] });
  });
});
