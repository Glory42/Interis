import { describe, expect, it, mock } from "bun:test";

const searchFilmsMock = mock(() => Promise.resolve<unknown[]>([]));
const searchSeriesMock = mock(() => Promise.resolve<unknown[]>([]));
const directorsMock = mock(() => Promise.resolve(new Map<number, string>()));
const creatorsMock = mock(() => Promise.resolve(new Map<number, string>()));

mock.module("../../../src/modules/films/films.service", () => ({
  FilmsService: { search: searchFilmsMock, findCachedDirectors: directorsMock },
}));
mock.module("../../../src/modules/tv/tv.service", () => ({
  TvService: { search: searchSeriesMock, findCachedCreators: creatorsMock },
}));

const { SearchService } = await import("../../../src/modules/search/search.service");

describe("SearchService.searchTitles (unit)", () => {
  it("merges movie and series results, tagging each with its media type", async () => {
    searchFilmsMock.mockResolvedValueOnce([
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
    searchFilmsMock.mockResolvedValueOnce([
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
    searchFilmsMock.mockResolvedValueOnce(
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

  it("adds the director or creator from cached titles and leaves uncached ones null", async () => {
    searchFilmsMock.mockResolvedValueOnce([
      { id: 1, title: "Cached Film", poster_path: null, release_date: "", popularity: 9 },
      { id: 3, title: "Uncached Film", poster_path: null, release_date: "", popularity: 1 },
    ]);
    searchSeriesMock.mockResolvedValueOnce([
      { id: 2, name: "Cached Show", poster_path: null, first_air_date: null, popularity: 5 },
    ]);
    directorsMock.mockResolvedValueOnce(new Map([[1, "Jane Director"]]));
    creatorsMock.mockResolvedValueOnce(new Map([[2, "Sam Creator"]]));

    const results = await SearchService.searchTitles("query");

    expect(results.map((result) => [result.title, result.credit])).toEqual([
      ["Cached Film", "Jane Director"],
      ["Cached Show", "Sam Creator"],
      ["Uncached Film", null],
    ]);
    expect(directorsMock).toHaveBeenLastCalledWith([1, 3]);
    expect(creatorsMock).toHaveBeenLastCalledWith([2]);
  });
});
