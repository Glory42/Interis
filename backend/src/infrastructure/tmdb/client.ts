import { z } from "zod";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

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

export const getMovieDetails = async (
  tmdbId: number,
): Promise<TMDBMovieDetail> => {
  const data = await fetchTMDB(`/movie/${tmdbId}?language=en-US`);
  return TMDBMovieDetailSchema.parse(data);
};
