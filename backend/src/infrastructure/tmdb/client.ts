import { z } from "zod";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const DIRECTOR_CACHE_TTL_MS = 30 * 60 * 1000;
const DIRECTOR_CACHE_MAX_ENTRIES = 1_000;

type DirectorCacheEntry = {
  value: string | null;
  expiresAt: number;
};

const directorCache = new Map<number, DirectorCacheEntry>();
const directorInFlight = new Map<number, Promise<string | null>>();

const pruneDirectorCache = (now: number): void => {
  for (const [cachedTmdbId, cacheEntry] of directorCache) {
    if (cacheEntry.expiresAt <= now) {
      directorCache.delete(cachedTmdbId);
    }
  }

  if (directorCache.size <= DIRECTOR_CACHE_MAX_ENTRIES) {
    return;
  }

  const overflow = directorCache.size - DIRECTOR_CACHE_MAX_ENTRIES;
  const cacheKeys = directorCache.keys();

  for (let index = 0; index < overflow; index += 1) {
    const nextKey = cacheKeys.next();
    if (nextKey.done) {
      break;
    }

    directorCache.delete(nextKey.value);
  }
};

export const TMDBSearchMovieSchema = z.object({
  id: z.number(),
  title: z.string(),
  poster_path: z.string().nullable(),
  release_date: z.string().default(""),
  overview: z.string().default(""),
});

export const TMDBMovieDetailSchema = z.object({
  id: z.number(),
  title: z.string(),
  original_title: z.string().default(""),
  poster_path: z.string().nullable(),
  backdrop_path: z.string().nullable(),
  release_date: z.string().default(""),
  runtime: z.number().nullable(),
  overview: z.string().default(""),
  tagline: z.string().default(""),
  genres: z.array(z.object({ id: z.number(), name: z.string() })).default([]),
});

const TMDBMovieCreditsSchema = z.object({
  crew: z
    .array(
      z.object({
        job: z.string().default(""),
        name: z.string().default(""),
      }),
    )
    .default([]),
});

export type TMDBSearchMovie = z.infer<typeof TMDBSearchMovieSchema>;
export type TMDBMovieDetail = z.infer<typeof TMDBMovieDetailSchema>;

const fetchTMDB = async (endpoint: string) => {
  const token = process.env.TMDB_ACCESS_TOKEN;
  if (!token) throw new Error("TMDB_ACCESS_TOKEN is missing in .env");

  const response = await fetch(`${TMDB_BASE_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      accept: "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`TMDB Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

export const searchMovies = async (
  query: string,
): Promise<TMDBSearchMovie[]> => {
  const data = await fetchTMDB(
    `/search/movie?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`,
  );
  const results = (data as { results?: unknown }).results ?? [];
  return z.array(TMDBSearchMovieSchema).parse(results);
};

export const getNowPlayingMovies = async (): Promise<TMDBSearchMovie[]> => {
  const data = await fetchTMDB(
    "/movie/now_playing?language=en-US&page=1&region=US",
  );
  const results = (data as { results?: unknown }).results ?? [];
  return z.array(TMDBSearchMovieSchema).parse(results);
};

export const getTrendingMovies = async (
  timeWindow: "day" | "week" = "week",
): Promise<TMDBSearchMovie[]> => {
  const data = await fetchTMDB(
    `/trending/movie/${timeWindow}?language=en-US`,
  );
  const results = (data as { results?: unknown }).results ?? [];
  return z.array(TMDBSearchMovieSchema).parse(results);
};

export const getMovieDetails = async (
  tmdbId: number,
): Promise<TMDBMovieDetail> => {
  const data = await fetchTMDB(`/movie/${tmdbId}?language=en-US`);
  return TMDBMovieDetailSchema.parse(data);
};

export const getMovieDirector = async (tmdbId: number): Promise<string | null> => {
  const now = Date.now();
  const cached = directorCache.get(tmdbId);

  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  if (cached) {
    directorCache.delete(tmdbId);
  }

  const inFlightRequest = directorInFlight.get(tmdbId);
  if (inFlightRequest) {
    return inFlightRequest;
  }

  const requestPromise = (async () => {
    const data = await fetchTMDB(`/movie/${tmdbId}/credits?language=en-US`);
    const credits = TMDBMovieCreditsSchema.parse(data);
    const director = credits.crew.find((member) => member.job === "Director")?.name ?? null;

    directorCache.set(tmdbId, {
      value: director,
      expiresAt: Date.now() + DIRECTOR_CACHE_TTL_MS,
    });
    pruneDirectorCache(Date.now());

    return director;
  })();

  directorInFlight.set(tmdbId, requestPromise);

  try {
    return await requestPromise;
  } finally {
    directorInFlight.delete(tmdbId);
  }
};
