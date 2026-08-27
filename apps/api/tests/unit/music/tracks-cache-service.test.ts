import { beforeEach, describe, expect, it, mock } from "bun:test";
import * as RealMbRecordings from "../../../src/infrastructure/musicbrainz/recordings";
import * as RealItunesTracks from "../../../src/infrastructure/itunes/tracks";
import * as RealTracksRepositoryModule from "../../../src/modules/music/repositories/tracks.repository";

const getRecordingDetailMock = mock(() => Promise.resolve<unknown>(null));
const findTrackPreviewMock = mock(() => Promise.resolve<unknown>(null));

const findByMbidMock = mock(() => Promise.resolve<unknown>(null));
const upsertOneMock = mock(() => Promise.resolve<unknown>(null));
const updatePreviewMock = mock(() => Promise.resolve<unknown>(null));

mock.module("../../../src/infrastructure/musicbrainz/recordings", () => ({
  ...RealMbRecordings,
  getRecordingDetail: getRecordingDetailMock,
}));

mock.module("../../../src/infrastructure/itunes/tracks", () => ({
  ...RealItunesTracks,
  findTrackPreview: findTrackPreviewMock,
}));

mock.module("../../../src/modules/music/repositories/tracks.repository", () => ({
  ...RealTracksRepositoryModule,
  TracksRepository: {
    ...RealTracksRepositoryModule.TracksRepository,
    findByMbid: findByMbidMock,
    upsertOne: upsertOneMock,
    updatePreview: updatePreviewMock,
  },
}));

const { TracksCacheService } = await import(
  "../../../src/modules/music/services/tracks-cache.service"
);

const buildTrackRow = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 1,
  mbid: "track-mbid",
  title: "Karma Police",
  artistName: "Radiohead",
  length: 264067,
  disambiguation: "",
  cachedAt: new Date(),
  previewUrl: null,
  previewFetchedAt: null,
  ...overrides,
});

const flushMicrotasks = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("TracksCacheService.findOrCreate iTunes preview enrichment (unit)", () => {
  beforeEach(() => {
    getRecordingDetailMock.mockReset();
    findTrackPreviewMock.mockReset();
    findByMbidMock.mockReset();
    upsertOneMock.mockReset();
    updatePreviewMock.mockReset();
  });

  it("does not refetch a preview once one has already been resolved", async () => {
    const resolvedRow = buildTrackRow({
      previewUrl: "https://example.com/preview.m4a",
      previewFetchedAt: new Date(),
    });
    findByMbidMock.mockResolvedValueOnce(resolvedRow);

    await TracksCacheService.findOrCreate("track-mbid");
    await flushMicrotasks();

    expect(findTrackPreviewMock).not.toHaveBeenCalled();
  });

  it("resolves a preview in the background for a track that has never been checked, without blocking the response", async () => {
    const uncheckedRow = buildTrackRow({ previewUrl: null, previewFetchedAt: null });
    findByMbidMock.mockResolvedValueOnce(uncheckedRow);
    findTrackPreviewMock.mockResolvedValueOnce({
      previewUrl: "https://example.com/preview.m4a",
    });

    const result = await TracksCacheService.findOrCreate("track-mbid");

    expect(result).toBe(uncheckedRow);
    await flushMicrotasks();
    expect(findTrackPreviewMock).toHaveBeenCalledWith("Radiohead", "Karma Police");
    expect(updatePreviewMock).toHaveBeenCalledWith(1, "https://example.com/preview.m4a");
  });

  it("retries a stale not-found preview after the retry cooldown has elapsed", async () => {
    const staleNotFoundRow = buildTrackRow({
      previewUrl: null,
      previewFetchedAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000),
    });
    findByMbidMock.mockResolvedValueOnce(staleNotFoundRow);
    findTrackPreviewMock.mockResolvedValueOnce(null);

    await TracksCacheService.findOrCreate("track-mbid");
    await flushMicrotasks();

    expect(findTrackPreviewMock).toHaveBeenCalledWith("Radiohead", "Karma Police");
    expect(updatePreviewMock).toHaveBeenCalledWith(1, null);
  });

  it("resolves a preview for a newly-cached track with no prior fetch attempt", async () => {
    findByMbidMock.mockResolvedValueOnce(null);
    getRecordingDetailMock.mockResolvedValueOnce({
      mbid: "track-mbid",
      title: "Karma Police",
      artistName: "Radiohead",
      length: 264067,
      disambiguation: "",
    });
    const newRow = buildTrackRow();
    upsertOneMock.mockResolvedValueOnce(newRow);
    findTrackPreviewMock.mockResolvedValueOnce({
      previewUrl: "https://example.com/preview.m4a",
    });

    await TracksCacheService.findOrCreate("track-mbid");
    await flushMicrotasks();

    expect(findTrackPreviewMock).toHaveBeenCalledWith("Radiohead", "Karma Police");
    expect(updatePreviewMock).toHaveBeenCalledWith(1, "https://example.com/preview.m4a");
  });
});
