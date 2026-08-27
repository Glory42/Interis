import { beforeEach, describe, expect, it, mock } from "bun:test";
import * as RealMbEditions from "../../../src/infrastructure/musicbrainz/editions";
import * as RealEditionsRepositoryModule from "../../../src/modules/music/repositories/editions.repository";
import * as RealTracksRepositoryModule from "../../../src/modules/music/repositories/tracks.repository";

const getReleasesForReleaseGroupMock = mock(() => Promise.resolve<unknown>([]));
const getReleaseTracklistMock = mock(() =>
  Promise.resolve<unknown>({ format: null, trackCount: 0, tracks: [] }),
);

const findByAlbumIdMock = mock(() => Promise.resolve<unknown>([]));
const findByMbidEditionMock = mock(() => Promise.resolve<unknown>(null));
const upsertManyEditionsMock = mock(() => Promise.resolve<unknown>([]));
const updateTracklistMetaMock = mock(() => Promise.resolve<unknown>(null));

const findByEditionIdMock = mock(() => Promise.resolve<unknown>([]));
const upsertManyTracksMock = mock(() => Promise.resolve<unknown>(new Map()));
const replaceEditionTracklistMock = mock(() => Promise.resolve<unknown>(undefined));

// Spread the real modules' exports rather than replacing them wholesale -
// `bun test tests/unit` runs every file in one process, and other files
// import other named exports from these same module paths.
mock.module("../../../src/infrastructure/musicbrainz/editions", () => ({
  ...RealMbEditions,
  getReleasesForReleaseGroup: getReleasesForReleaseGroupMock,
  getReleaseTracklist: getReleaseTracklistMock,
}));

mock.module("../../../src/modules/music/repositories/editions.repository", () => ({
  ...RealEditionsRepositoryModule,
  EditionsRepository: {
    ...RealEditionsRepositoryModule.EditionsRepository,
    findByAlbumId: findByAlbumIdMock,
    findByMbid: findByMbidEditionMock,
    upsertMany: upsertManyEditionsMock,
    updateTracklistMeta: updateTracklistMetaMock,
  },
}));

mock.module("../../../src/modules/music/repositories/tracks.repository", () => ({
  ...RealTracksRepositoryModule,
  TracksRepository: {
    ...RealTracksRepositoryModule.TracksRepository,
    findByEditionId: findByEditionIdMock,
    upsertMany: upsertManyTracksMock,
    replaceEditionTracklist: replaceEditionTracklistMock,
  },
}));

const { EditionsCacheService } = await import(
  "../../../src/modules/music/services/editions-cache.service"
);

const buildEditionRow = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 1,
  albumId: 1,
  mbid: "edition-mbid-1",
  title: "OK Computer",
  status: "Official",
  packaging: null,
  country: null,
  releaseDate: "1997-05-21",
  releaseYear: 1997,
  format: null,
  trackCount: null,
  disambiguation: null,
  cachedAt: new Date(),
  ...overrides,
});

const buildTrackRow = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 1,
  mbid: "recording-mbid-1",
  title: "Airbag",
  artistName: "Radiohead",
  length: 284400,
  disambiguation: null,
  discNumber: 1,
  position: 1,
  ...overrides,
});

describe("EditionsCacheService.findOrCreateEditionsForAlbum (unit)", () => {
  beforeEach(() => {
    getReleasesForReleaseGroupMock.mockReset();
    findByAlbumIdMock.mockReset();
    upsertManyEditionsMock.mockReset();
  });

  it("returns the cached editions without calling MusicBrainz when they already exist", async () => {
    const cachedEditions = [buildEditionRow()];
    findByAlbumIdMock.mockResolvedValueOnce(cachedEditions);

    const result = await EditionsCacheService.findOrCreateEditionsForAlbum(1, "album-mbid");

    expect(result).toBe(cachedEditions);
    expect(getReleasesForReleaseGroupMock).not.toHaveBeenCalled();
    expect(upsertManyEditionsMock).not.toHaveBeenCalled();
  });

  it("fetches releases from MusicBrainz and caches them when none exist yet", async () => {
    const freshEditions = [buildEditionRow()];
    const releaseStubs = [
      {
        mbid: "edition-mbid-1",
        title: "OK Computer",
        status: "Official",
        packaging: null,
        country: null,
        date: "1997-05-21",
        disambiguation: null,
      },
    ];
    findByAlbumIdMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(freshEditions);
    getReleasesForReleaseGroupMock.mockResolvedValueOnce(releaseStubs);

    const result = await EditionsCacheService.findOrCreateEditionsForAlbum(1, "album-mbid");

    expect(getReleasesForReleaseGroupMock).toHaveBeenCalledWith("album-mbid");
    expect(upsertManyEditionsMock).toHaveBeenCalledWith(1, releaseStubs);
    expect(result).toBe(freshEditions);
  });
});

describe("EditionsCacheService.findOrCreateTracklistForEdition (unit)", () => {
  beforeEach(() => {
    getReleaseTracklistMock.mockReset();
    findByEditionIdMock.mockReset();
    upsertManyTracksMock.mockReset();
    replaceEditionTracklistMock.mockReset();
    updateTracklistMetaMock.mockReset();
  });

  it("returns the cached tracklist without calling MusicBrainz when tracks already exist", async () => {
    const cachedTracks = [buildTrackRow()];
    findByEditionIdMock.mockResolvedValueOnce(cachedTracks);

    const result = await EditionsCacheService.findOrCreateTracklistForEdition(1, "edition-mbid");

    expect(result).toBe(cachedTracks);
    expect(getReleaseTracklistMock).not.toHaveBeenCalled();
  });

  it("fetches the tracklist from MusicBrainz, caches tracks and slots, and updates edition metadata", async () => {
    const trackStub = {
      recordingMbid: "recording-mbid-1",
      title: "Airbag",
      artistName: "Radiohead",
      length: 284400,
      disambiguation: null,
      discNumber: 1,
      position: 1,
    };
    const freshTracks = [buildTrackRow()];
    findByEditionIdMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(freshTracks);
    getReleaseTracklistMock.mockResolvedValueOnce({
      format: "CD",
      trackCount: 1,
      tracks: [trackStub],
    });
    upsertManyTracksMock.mockResolvedValueOnce(new Map([["recording-mbid-1", 42]]));

    const result = await EditionsCacheService.findOrCreateTracklistForEdition(1, "edition-mbid");

    expect(getReleaseTracklistMock).toHaveBeenCalledWith("edition-mbid");
    expect(replaceEditionTracklistMock).toHaveBeenCalledWith(1, [
      { trackId: 42, discNumber: 1, position: 1 },
    ]);
    expect(updateTracklistMetaMock).toHaveBeenCalledWith(1, { format: "CD", trackCount: 1 });
    expect(result).toBe(freshTracks);
  });

  it("drops tracklist entries whose recording failed to upsert instead of inserting a broken FK", async () => {
    const trackStub = {
      recordingMbid: "recording-mbid-missing",
      title: "Untitled",
      artistName: "Radiohead",
      length: null,
      disambiguation: null,
      discNumber: 1,
      position: 1,
    };
    findByEditionIdMock.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    getReleaseTracklistMock.mockResolvedValueOnce({
      format: null,
      trackCount: 1,
      tracks: [trackStub],
    });
    upsertManyTracksMock.mockResolvedValueOnce(new Map());

    await EditionsCacheService.findOrCreateTracklistForEdition(1, "edition-mbid");

    expect(replaceEditionTracklistMock).toHaveBeenCalledWith(1, []);
  });
});
