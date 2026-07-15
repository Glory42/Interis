import { z } from "zod";

export const tmdbSearchSeriesSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  poster_path: z.string().nullable(),
  first_air_date: z.string(),
  overview: z.string(),
});

export const tmdbSearchSeriesListSchema = z.array(tmdbSearchSeriesSchema);
