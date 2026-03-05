import { z } from "zod";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export const TMDBMovieSchema = z.object({
    id: z.number(),
    title: z.string(),
    poster_path: z.string().nullable(), 
    release_date: z.string().default(""),
    overview: z.string().default(""),
});

export type TMDBMovie = z.infer<typeof TMDBMovieSchema>;

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

export const searchMovies = async (query: string): Promise<TMDBMovie[]> => {
    const data = await fetchTMDB(
        `/search/movie?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`
    );

    return z.array(TMDBMovieSchema).parse((data as { results: TMDBMovie[] })?.results || []);
};

export const getMovieDetails = async (id: number): Promise<TMDBMovie> => {
    const data = await fetchTMDB(`/movie/${id}?language=en-US`);
    return TMDBMovieSchema.parse((data as TMDBMovie));
};