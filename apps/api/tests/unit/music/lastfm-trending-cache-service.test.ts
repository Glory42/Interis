import { beforeEach, describe, expect, it, mock } from "bun:test";
import * as RealLastfmCharts from "../../../src/infrastructure/lastfm/charts";
import * as RealMbAlbums from "../../../src/infrastructure/musicbrainz/albums";
import * as RealLastfmTrendingRepositoryModule from "../../../src/modules/music/repositories/lastfm-trending-cache.repository";

const getTopArtistsMock = mock(() => Promise.resolve<string[]>([]));
const getTopAlbumForArtistMock = mock(() => Promise.resolve<string | null>(null));
const searchAlbumsMock = mock(() => Promise.resolve<unknown[]>([]));

const findByChartKeyMock = mock(() => Promise.resolve<unknown>(null));
const upsertMock = mock(() => Promise.resolve<unknown>(null));

mock.module("../../../src/infrastructure/lastfm/charts", () => ({
  ...RealLastfmCharts,
  getTopArtists: getTopArtistsMock,
  getTopAlbumForArtist: getTopAlbumForArtistMock,
}));

mock.module("../../../src/infrastructure/musicbrainz/albums", () => ({
  ...RealMbAlbums,
  searchAlbums: searchAlbumsMock,
}));

mock.module("../../../src/modules/music/repositories/lastfm-trending-cache.repository", () => ({
  ...RealLastfmTrendingRepositoryModule,
  LastfmTrendingCacheRepository: {
    ...RealLastfmTrendingRepositoryModule.LastfmTrendingCacheRepository,
    findByChartKey: findByChartKeyMock,
    upsert: upsertMock,
  },
}));

const { LastfmTrendingCacheService } = await import(
  "../../../src/modules/music/services/lastfm-trending-cache.service"
);

const buildItems = () => [{ artistName: "Radiohead", albumTitle: "OK Computer", mbid: "rg-1" }];

describe("LastfmTrendingCacheService.getTrendingList (unit)", () => {
  beforeEach(() => {
    getTopArtistsMock.mockReset();
    getTopAlbumForArtistMock.mockReset();
    searchAlbumsMock.mockReset();
    findByChartKeyMock.mockReset();
    upsertMock.mockReset();
  });

  it("returns the cached list without calling Last.fm/MusicBrainz when it is fresh", async () => {
    const items = buildItems();
    findByChartKeyMock.mockResolvedValueOnce({ items, fetchedAt: new Date() });

    const result = await LastfmTrendingCacheService.getTrendingList("global");

    expect(result).toBe(items);
    expect(getTopArtistsMock).not.toHaveBeenCalled();
  });

  it("serves the stale cache immediately and refreshes in the background", async () => {
    const staleItems = buildItems();
    findByChartKeyMock.mockResolvedValueOnce({
      items: staleItems,
      fetchedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
    });
    getTopArtistsMock.mockResolvedValueOnce(["New Artist"]);
    getTopAlbumForArtistMock.mockResolvedValueOnce("New Album");
    searchAlbumsMock.mockResolvedValueOnce([{ id: "rg-2" }]);

    const result = await LastfmTrendingCacheService.getTrendingList("global");

    expect(result).toBe(staleItems);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(getTopArtistsMock).toHaveBeenCalledTimes(1);
    expect(upsertMock).toHaveBeenCalledWith("global", [
      { artistName: "New Artist", albumTitle: "New Album", mbid: "rg-2" },
    ]);
  });

  it("blocks on a genuinely cold cache, resolving each artist's top album to an mbid", async () => {
    findByChartKeyMock.mockResolvedValueOnce(null);
    getTopArtistsMock.mockResolvedValueOnce(["Radiohead"]);
    getTopAlbumForArtistMock.mockResolvedValueOnce("OK Computer");
    searchAlbumsMock.mockResolvedValueOnce([{ id: "rg-1" }]);
    const items = buildItems();
    upsertMock.mockResolvedValueOnce({ items, fetchedAt: new Date() });

    const result = await LastfmTrendingCacheService.getTrendingList("global");

    expect(getTopArtistsMock).toHaveBeenCalledTimes(1);
    expect(upsertMock).toHaveBeenCalledWith("global", items);
    expect(result).toEqual(items);
  });

  it("drops an artist whose top album can't be resolved to a MusicBrainz mbid", async () => {
    findByChartKeyMock.mockResolvedValueOnce(null);
    getTopArtistsMock.mockResolvedValueOnce(["Unresolvable Artist"]);
    getTopAlbumForArtistMock.mockResolvedValueOnce("Some Album");
    searchAlbumsMock.mockResolvedValueOnce([]);
    upsertMock.mockResolvedValueOnce(null);

    const result = await LastfmTrendingCacheService.getTrendingList("global");

    expect(result).toEqual([]);
    expect(upsertMock).not.toHaveBeenCalled();
  });
});
