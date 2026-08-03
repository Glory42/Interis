import { beforeEach, describe, expect, it, mock } from "bun:test";

const getMovieDetailsMock = mock(() => Promise.resolve<unknown>(null));
const getMovieDirectorMock = mock(() => Promise.resolve<string | null>(null));
const findByTmdbIdMock = mock(() => Promise.resolve<unknown>(null));
const upsertCachedMovieMock = mock(() => Promise.resolve<unknown>(null));

mock.module("../../../src/infrastructure/tmdb/cinemas", () => ({
  getMovieDetails: getMovieDetailsMock,
  getMovieDirector: getMovieDirectorMock,
}));

mock.module("../../../src/modules/movies/repositories/movies.repository", () => ({
  MoviesRepository: {
    findByTmdbId: findByTmdbIdMock,
    upsertCachedMovie: upsertCachedMovieMock,
  },
}));

const { MoviesCacheService } = await import(
  "../../../src/modules/movies/services/movies-cache.service"
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

const buildMovieRow = (overrides: Partial<Record<string, unknown>> = {}) => ({
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

describe("MoviesCacheService.findOrCreate (unit)", () => {
  beforeEach(() => {
    getMovieDetailsMock.mockReset();
    getMovieDirectorMock.mockReset();
    findByTmdbIdMock.mockReset();
    upsertCachedMovieMock.mockReset();
  });

  it("returns the cached row without calling TMDB when it is fresh", async () => {
    const freshRow = buildMovieRow();
    findByTmdbIdMock.mockResolvedValueOnce(freshRow);

    const result = await MoviesCacheService.findOrCreate(550);

    expect(result).toBe(freshRow);
    expect(getMovieDetailsMock).not.toHaveBeenCalled();
  });

  it("refetches and re-caches when the row is older than the 7-day TTL", async () => {
    const staleRow = buildMovieRow({
      title: "Old Title",
      cachedAt: new Date(Date.now() - 8 * ONE_DAY_MS),
    });
    const refreshedRow = buildMovieRow();
    findByTmdbIdMock.mockResolvedValueOnce(staleRow);
    getMovieDetailsMock.mockResolvedValueOnce(tmdbDetail);
    getMovieDirectorMock.mockResolvedValueOnce("David Fincher");
    upsertCachedMovieMock.mockResolvedValueOnce(refreshedRow);

    const result = await MoviesCacheService.findOrCreate(550);

    expect(getMovieDetailsMock).toHaveBeenCalledTimes(1);
    expect(upsertCachedMovieMock).toHaveBeenCalledTimes(1);
    expect(result).toBe(refreshedRow);
  });

  it("falls back to the stale cached row when TMDB is unreachable", async () => {
    const staleRow = buildMovieRow({
      title: "Old Title",
      cachedAt: new Date(Date.now() - 8 * ONE_DAY_MS),
    });
    findByTmdbIdMock.mockResolvedValueOnce(staleRow);
    getMovieDetailsMock.mockImplementationOnce(() => Promise.reject(new Error("network down")));

    const result = await MoviesCacheService.findOrCreate(550);

    expect(result).toBe(staleRow);
    expect(upsertCachedMovieMock).not.toHaveBeenCalled();
  });

  it("throws NotFoundError when there is no cache and TMDB is unreachable", async () => {
    findByTmdbIdMock.mockResolvedValueOnce(null);
    getMovieDetailsMock.mockImplementationOnce(() => Promise.reject(new Error("network down")));

    await expect(MoviesCacheService.findOrCreate(550)).rejects.toThrow("Movie not found");
    expect(upsertCachedMovieMock).not.toHaveBeenCalled();
  });

  it("caches a newly-seen movie when there is no existing row", async () => {
    const newRow = buildMovieRow({ id: 2 });
    findByTmdbIdMock.mockResolvedValueOnce(null);
    getMovieDetailsMock.mockResolvedValueOnce(tmdbDetail);
    getMovieDirectorMock.mockResolvedValueOnce("David Fincher");
    upsertCachedMovieMock.mockResolvedValueOnce(newRow);

    const result = await MoviesCacheService.findOrCreate(550);

    expect(result).toBe(newRow);
    expect(upsertCachedMovieMock).toHaveBeenCalledWith(
      expect.objectContaining({ tmdbId: 550, director: "David Fincher" }),
    );
  });
});

describe("MoviesCacheService.refreshForAdmin (unit)", () => {
  beforeEach(() => {
    getMovieDetailsMock.mockReset();
    getMovieDirectorMock.mockReset();
    findByTmdbIdMock.mockReset();
    upsertCachedMovieMock.mockReset();
  });

  it("always refetches from TMDB, bypassing the TTL and cache lookup entirely", async () => {
    const refreshedRow = buildMovieRow();
    getMovieDetailsMock.mockResolvedValueOnce(tmdbDetail);
    getMovieDirectorMock.mockResolvedValueOnce("David Fincher");
    upsertCachedMovieMock.mockResolvedValueOnce(refreshedRow);

    const result = await MoviesCacheService.refreshForAdmin(550);

    expect(findByTmdbIdMock).not.toHaveBeenCalled();
    expect(getMovieDetailsMock).toHaveBeenCalledTimes(1);
    expect(result).toBe(refreshedRow);
  });

  it("propagates the error instead of falling back when TMDB fails", async () => {
    getMovieDetailsMock.mockImplementationOnce(() => Promise.reject(new Error("network down")));

    await expect(MoviesCacheService.refreshForAdmin(550)).rejects.toThrow("network down");
    expect(upsertCachedMovieMock).not.toHaveBeenCalled();
  });
});
