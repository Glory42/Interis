import { beforeEach, describe, expect, it, mock } from "bun:test";
import * as RealMbAlbums from "../../../src/infrastructure/musicbrainz/albums";
import * as RealLastfmAlbums from "../../../src/infrastructure/lastfm/albums";
import * as RealMusicCacheRepositoryModule from "../../../src/modules/music/repositories/music-cache.repository";

const getReleaseGroupDetailMock = mock(() => Promise.resolve<unknown>(null));
const getCoverArtUrlMock = mock(() => Promise.resolve<string | null>(null));
const getAlbumStatsMock = mock(() => Promise.resolve<unknown>(null));

const findByMbidMock = mock(() => Promise.resolve<unknown>(null));
const upsertMock = mock(() => Promise.resolve<unknown>(null));
const updateLastfmStatsMock = mock(() => Promise.resolve<unknown>(null));
const updateCoverArtUrlMock = mock(() => Promise.resolve<unknown>(null));

mock.module("../../../src/infrastructure/musicbrainz/albums", () => ({
  ...RealMbAlbums,
  getReleaseGroupDetail: getReleaseGroupDetailMock,
  getCoverArtUrl: getCoverArtUrlMock,
}));

mock.module("../../../src/infrastructure/lastfm/albums", () => ({
  ...RealLastfmAlbums,
  getAlbumStats: getAlbumStatsMock,
}));

mock.module("../../../src/modules/music/repositories/music-cache.repository", () => ({
  ...RealMusicCacheRepositoryModule,
  MusicCacheRepository: {
    ...RealMusicCacheRepositoryModule.MusicCacheRepository,
    findByMbid: findByMbidMock,
    upsert: upsertMock,
    updateLastfmStats: updateLastfmStatsMock,
    updateCoverArtUrl: updateCoverArtUrlMock,
  },
}));

const { MusicCacheService } = await import(
  "../../../src/modules/music/services/music-cache.service"
);

const buildAlbumRow = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 1,
  mbid: "album-mbid",
  title: "OK Computer",
  artistName: "Radiohead",
  artistMbid: null,
  coverArtUrl: null,
  primaryType: null,
  secondaryTypes: [],
  firstReleaseDate: null,
  firstReleaseYear: null,
  genres: [],
  disambiguation: null,
  cachedAt: new Date(),
  lastfmListeners: null,
  lastfmPlaycount: null,
  lastfmFetchedAt: null,
  ...overrides,
});

const flushMicrotasks = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("MusicCacheService.findOrCreate Last.fm enrichment (unit)", () => {
  beforeEach(() => {
    getReleaseGroupDetailMock.mockReset();
    getCoverArtUrlMock.mockReset();
    getAlbumStatsMock.mockReset();
    findByMbidMock.mockReset();
    upsertMock.mockReset();
    updateLastfmStatsMock.mockReset();
    updateCoverArtUrlMock.mockReset();
  });

  it("does not refresh Last.fm stats when they were fetched recently", async () => {
    const freshRow = buildAlbumRow({
      lastfmFetchedAt: new Date(),
      coverArtUrl: "https://example.com/cover.jpg",
    });
    findByMbidMock.mockResolvedValueOnce(freshRow);

    await MusicCacheService.findOrCreate("album-mbid");
    await flushMicrotasks();

    expect(getAlbumStatsMock).not.toHaveBeenCalled();
  });

  it("refreshes Last.fm stats in the background when they are stale, without blocking the response", async () => {
    const staleRow = buildAlbumRow({
      lastfmFetchedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      coverArtUrl: "https://example.com/cover.jpg",
    });
    findByMbidMock.mockResolvedValueOnce(staleRow);
    getAlbumStatsMock.mockResolvedValueOnce({ listeners: 100, playcount: 200 });

    const result = await MusicCacheService.findOrCreate("album-mbid");

    expect(result).toBe(staleRow);
    await flushMicrotasks();
    expect(getAlbumStatsMock).toHaveBeenCalledWith("Radiohead", "OK Computer");
    expect(updateLastfmStatsMock).toHaveBeenCalledWith(1, { listeners: 100, playcount: 200 });
  });

  it("refreshes Last.fm stats for a newly-cached album with no prior fetch", async () => {
    findByMbidMock.mockResolvedValueOnce(null);
    getReleaseGroupDetailMock.mockResolvedValueOnce({
      id: "album-mbid",
      title: "OK Computer",
      "artist-credit": [{ name: "Radiohead", artist: { id: "artist-1" } }],
      "primary-type": "Album",
      "secondary-types": [],
      "first-release-date": "1997-05-21",
      tags: [],
      disambiguation: "",
    });
    getCoverArtUrlMock.mockResolvedValueOnce(null);
    const newRow = buildAlbumRow();
    upsertMock.mockResolvedValueOnce(newRow);
    getAlbumStatsMock.mockResolvedValueOnce({ listeners: 50, playcount: 75 });

    await MusicCacheService.findOrCreate("album-mbid");
    await flushMicrotasks();

    expect(getAlbumStatsMock).toHaveBeenCalledWith("Radiohead", "OK Computer");
    expect(updateLastfmStatsMock).toHaveBeenCalledWith(1, { listeners: 50, playcount: 75 });
  });

  it("does not re-fetch cover art for an album that already has one", async () => {
    const withArtRow = buildAlbumRow({
      coverArtUrl: "https://example.com/cover.jpg",
      lastfmFetchedAt: new Date(),
    });
    findByMbidMock.mockResolvedValueOnce(withArtRow);

    await MusicCacheService.findOrCreate("album-mbid");
    await flushMicrotasks();

    expect(getCoverArtUrlMock).not.toHaveBeenCalled();
  });

  it("backfills cover art in the background for an already-cached album still missing it", async () => {
    const noArtRow = buildAlbumRow({ coverArtUrl: null, lastfmFetchedAt: new Date() });
    findByMbidMock.mockResolvedValueOnce(noArtRow);
    getCoverArtUrlMock.mockResolvedValueOnce("https://example.com/backfilled-cover.jpg");

    const result = await MusicCacheService.findOrCreate("album-mbid");

    expect(result).toBe(noArtRow);
    await flushMicrotasks();
    expect(getCoverArtUrlMock).toHaveBeenCalledWith("album-mbid");
    expect(updateCoverArtUrlMock).toHaveBeenCalledWith(1, "https://example.com/backfilled-cover.jpg");
  });
});
