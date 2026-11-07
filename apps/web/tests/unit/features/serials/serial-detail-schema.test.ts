import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../../../support/msw/server";
import { getSeriesDetail } from "@/features/serials/api";

describe("getSeriesDetail", () => {
  // The API nests the count inside the season's viewerInteraction.
  it("reads each season's watched-episode count", async () => {
    const base = await (await fetch("http://localhost/api/serials/1396/detail")).json();
    const season = (viewerInteraction: unknown) => ({
      id: 3572,
      seasonNumber: 1,
      name: "Season 1",
      episodeCount: 7,
      airDate: "2008-01-20",
      posterPath: null,
      viewerInteraction,
    });
    server.use(
      http.get("*/api/serials/1396/detail", () =>
        HttpResponse.json({
          ...base,
          reviewsPage: 1,
          reviewsLimit: 10,
          reviewsHasMore: false,
          similar: [],
          viewerTracking: null,
          series: {
            ...base.series,
            seasons: [
              season({ watched: false, liked: false, rating: null, hasReview: false, watchedEpisodeCount: 3 }),
              { ...season(null), id: 3573, seasonNumber: 2 },
            ],
          },
        }),
      ),
    );

    const detail = await getSeriesDetail(1396);
    expect(detail.series.seasons.map((entry) => entry.watchedEpisodeCount)).toEqual([3, 0]);
  });
});
