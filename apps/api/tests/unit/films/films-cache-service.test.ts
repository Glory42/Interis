import { beforeEach, describe, expect, it, mock } from "bun:test";
import * as RealFilms from "../../../src/infrastructure/tmdb/films";
import * as RealFilmsRepositoryModule from "../../../src/modules/films/repositories/films.repository";

const getFilmDetailsMock = mock(() => Promise.resolve<unknown>(null));
const getFilmDirectorMock = mock(() => Promise.resolve<string | null>(null));
const findByTmdbIdMock = mock(() => Promise.resolve<unknown>(null));
const upsertCachedFilmMock = mock(() => Promise.resolve<unknown>(null));

// Spread the real module's exports rather than replacing the module
// wholesale - `bun test tests/unit` runs every file in one process, and
// other files import other named exports (e.g. searchMovieByTitleAndYear)
// from these same module paths. A bare replacement here would silently
// break them.
mock.module("../../../src/infrastructure/tmdb/films", () => ({
  ...RealFilms,
  getFilmDetails: getFilmDetailsMock,
  getFilmDirector: getFilmDirectorMock,
}));

mock.module("../../../src/modules/films/repositories/films.repository", () => ({
  ...RealFilmsRepositoryModule,
  FilmsRepository: {
    ...RealFilmsRepositoryModule.FilmsRepository,
    findByTmdbId: findByTmdbIdMock,
    upsertCachedMovie: upsertCachedFilmMock,
  },
}));

const { FilmsCacheService } = await import(
  "../../../src/modules/films/services/films-cache.service"
);

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const tmdbDetail = {
  id: 550,
  title: "Fight Club",
  original_title: "Fight Club",
  poster_path: "/poster.jpg",
  backdrop_path: "/backdrop.jpg",
  release_date: "1999-10-15",
  runtime: 139,
  overview: "An insomniac office worker...",
  tagline: "Mischief. Mayhem. Soap.",
  genres: [{ id: 18, name: "Drama" }],
};

const buildFilmRow = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 1,
  tmdbId: 550,
  title: "Fight Club",
  originalTitle: "Fight Club",
  posterPath: "/poster.jpg",
  backdropPath: "/backdrop.jpg",
  releaseDate: "1999-10-15",
  releaseYear: 1999,
  director: "David Fincher",
  runtime: 139,
  overview: "An insomniac office worker...",
  tagline: "Mischief. Mayhem. Soap.",
  genres: [{ id: 18, name: "Drama" }],
  cachedAt: new Date(),
  ...overrides,
});

describe("FilmsCacheService.findOrCreate (unit)", () => {
  beforeEach(() => {
    getFilmDetailsMock.mockReset();
    getFilmDirectorMock.mockReset();
    findByTmdbIdMock.mockReset();
    upsertCachedFilmMock.mockReset();
  });

  it("returns the cached row without calling TMDB when it is fresh", async () => {
    const freshRow = buildFilmRow();
    findByTmdbIdMock.mockResolvedValueOnce(freshRow);

    const result = await FilmsCacheService.findOrCreate(550);

    expect(result).toBe(freshRow);
    expect(getFilmDetailsMock).not.toHaveBeenCalled();
  });

  it("refetches and re-caches when the row is older than the 7-day TTL", async () => {
    const staleRow = buildFilmRow({
      title: "Old Title",
      cachedAt: new Date(Date.now() - 8 * ONE_DAY_MS),
    });
    const refreshedRow = buildFilmRow();
    findByTmdbIdMock.mockResolvedValueOnce(staleRow);
    getFilmDetailsMock.mockResolvedValueOnce(tmdbDetail);
    getFilmDirectorMock.mockResolvedValueOnce("David Fincher");
    upsertCachedFilmMock.mockResolvedValueOnce(refreshedRow);

    const result = await FilmsCacheService.findOrCreate(550);

    expect(getFilmDetailsMock).toHaveBeenCalledTimes(1);
    expect(upsertCachedFilmMock).toHaveBeenCalledTimes(1);
    expect(result).toBe(refreshedRow);
  });

  it("falls back to the stale cached row when TMDB is unreachable", async () => {
    const staleRow = buildFilmRow({
      title: "Old Title",
      cachedAt: new Date(Date.now() - 8 * ONE_DAY_MS),
    });
    findByTmdbIdMock.mockResolvedValueOnce(staleRow);
    getFilmDetailsMock.mockImplementationOnce(() => Promise.reject(new Error("network down")));

    const result = await FilmsCacheService.findOrCreate(550);

    expect(result).toBe(staleRow);
    expect(upsertCachedFilmMock).not.toHaveBeenCalled();
  });

  it("throws NotFoundError when there is no cache and TMDB is unreachable", async () => {
    findByTmdbIdMock.mockResolvedValueOnce(null);
    getFilmDetailsMock.mockImplementationOnce(() => Promise.reject(new Error("network down")));

    await expect(FilmsCacheService.findOrCreate(550)).rejects.toThrow("Movie not found");
    expect(upsertCachedFilmMock).not.toHaveBeenCalled();
  });

  it("caches a newly-seen movie when there is no existing row", async () => {
    const newRow = buildFilmRow({ id: 2 });
    findByTmdbIdMock.mockResolvedValueOnce(null);
    getFilmDetailsMock.mockResolvedValueOnce(tmdbDetail);
    getFilmDirectorMock.mockResolvedValueOnce("David Fincher");
    upsertCachedFilmMock.mockResolvedValueOnce(newRow);

    const result = await FilmsCacheService.findOrCreate(550);

    expect(result).toBe(newRow);
    expect(upsertCachedFilmMock).toHaveBeenCalledWith(
      expect.objectContaining({ tmdbId: 550, director: "David Fincher" }),
    );
  });
});

describe("FilmsCacheService.refreshForAdmin (unit)", () => {
  beforeEach(() => {
    getFilmDetailsMock.mockReset();
    getFilmDirectorMock.mockReset();
    findByTmdbIdMock.mockReset();
    upsertCachedFilmMock.mockReset();
  });

  it("always refetches from TMDB, bypassing the TTL and cache lookup entirely", async () => {
    const refreshedRow = buildFilmRow();
    getFilmDetailsMock.mockResolvedValueOnce(tmdbDetail);
    getFilmDirectorMock.mockResolvedValueOnce("David Fincher");
    upsertCachedFilmMock.mockResolvedValueOnce(refreshedRow);

    const result = await FilmsCacheService.refreshForAdmin(550);

    expect(findByTmdbIdMock).not.toHaveBeenCalled();
    expect(getFilmDetailsMock).toHaveBeenCalledTimes(1);
    expect(result).toBe(refreshedRow);
  });

  it("propagates the error instead of falling back when TMDB fails", async () => {
    getFilmDetailsMock.mockImplementationOnce(() => Promise.reject(new Error("network down")));

    await expect(FilmsCacheService.refreshForAdmin(550)).rejects.toThrow("network down");
    expect(upsertCachedFilmMock).not.toHaveBeenCalled();
  });
});

describe("FilmsCacheService.findForRead (unit)", () => {
  beforeEach(() => {
    getFilmDetailsMock.mockReset();
    getFilmDirectorMock.mockReset();
    findByTmdbIdMock.mockReset();
    upsertCachedFilmMock.mockReset();
  });

  it("returns an unsaved row for an uncached movie without inserting it", async () => {
    findByTmdbIdMock.mockResolvedValueOnce(null);
    getFilmDetailsMock.mockResolvedValueOnce(tmdbDetail);
    getFilmDirectorMock.mockResolvedValueOnce("David Fincher");

    const result = await FilmsCacheService.findForRead(550);

    expect(result).toMatchObject({ id: 0, tmdbId: 550, title: "Fight Club", director: "David Fincher" });
    expect(upsertCachedFilmMock).not.toHaveBeenCalled();
  });

  it("skips the write when a stale row's TMDB data is unchanged", async () => {
    const staleRow = buildFilmRow({ cachedAt: new Date(Date.now() - 8 * ONE_DAY_MS) });
    findByTmdbIdMock.mockResolvedValueOnce(staleRow);
    getFilmDetailsMock.mockResolvedValueOnce(tmdbDetail);
    // A transient director-lookup miss must not count as a change.
    getFilmDirectorMock.mockResolvedValueOnce(null);

    const result = await FilmsCacheService.findForRead(550);

    expect(result).toBe(staleRow);
    expect(upsertCachedFilmMock).not.toHaveBeenCalled();
  });

  it("rewrites a stale row when TMDB data changed", async () => {
    const staleRow = buildFilmRow({
      title: "Old Title",
      cachedAt: new Date(Date.now() - 8 * ONE_DAY_MS),
    });
    const refreshedRow = buildFilmRow();
    findByTmdbIdMock.mockResolvedValueOnce(staleRow);
    getFilmDetailsMock.mockResolvedValueOnce(tmdbDetail);
    getFilmDirectorMock.mockResolvedValueOnce("David Fincher");
    upsertCachedFilmMock.mockResolvedValueOnce(refreshedRow);

    const result = await FilmsCacheService.findForRead(550);

    expect(result).toBe(refreshedRow);
    expect(upsertCachedFilmMock).toHaveBeenCalledTimes(1);
  });
});
