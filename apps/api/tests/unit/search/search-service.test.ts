import { describe, expect, it, mock } from "bun:test";

const searchMoviesMock = mock(() => Promise.resolve<unknown[]>([]));
const searchSeriesMock = mock(() => Promise.resolve<unknown[]>([]));

mock.module("../../../src/modules/movies/movies.service", () => ({
  MoviesService: { search: searchMoviesMock },
}));
mock.module("../../../src/modules/serials/serials.service", () => ({
  SerialsService: { search: searchSeriesMock },
}));

const { SearchService } = await import("../../../src/modules/search/search.service");

describe("SearchService.searchTitles (unit)", () => {
  it("merges movie and series results, tagging each with its media type", async () => {
    searchMoviesMock.mockResolvedValueOnce([
      { id: 1, title: "A Movie", poster_path: "/a.jpg", release_date: "2020-01-01", popularity: 5 },
    ]);
    searchSeriesMock.mockResolvedValueOnce([
      { id: 2, name: "A Show", poster_path: "/b.jpg", first_air_date: "2021-01-01", popularity: 8 },
    ]);

    const results = await SearchService.searchTitles("query");

    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({ mediaType: "tv", tmdbId: 2, title: "A Show" });
    expect(results[1]).toMatchObject({ mediaType: "movie", tmdbId: 1, title: "A Movie" });
  });

  it("sorts merged results by popularity descending", async () => {
    searchMoviesMock.mockResolvedValueOnce([
      { id: 1, title: "Low", poster_path: null, release_date: "", popularity: 1 },
      { id: 3, title: "High", poster_path: null, release_date: "", popularity: 99 },
    ]);
    searchSeriesMock.mockResolvedValueOnce([
      { id: 2, name: "Mid", poster_path: null, first_air_date: null, popularity: 50 },
    ]);

    const results = await SearchService.searchTitles("query");

    expect(results.map((r) => r.title)).toEqual(["High", "Mid", "Low"]);
  });

  it("caps results at 20", async () => {
    searchMoviesMock.mockResolvedValueOnce(
      Array.from({ length: 15 }, (_, i) => ({
        id: i,
        title: `Movie ${i}`,
        poster_path: null,
        release_date: "",
        popularity: i,
      })),
    );
    searchSeriesMock.mockResolvedValueOnce(
      Array.from({ length: 15 }, (_, i) => ({
        id: i + 100,
        name: `Show ${i}`,
        poster_path: null,
        first_air_date: null,
        popularity: i,
      })),
    );

    const results = await SearchService.searchTitles("query");

    expect(results).toHaveLength(20);
  });
});
