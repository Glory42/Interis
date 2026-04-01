import { tmdbIdSchema } from "./common.schemas";

export const parseTmdbIdParam = (rawTmdbId: unknown): number | null => {
  const parsed = tmdbIdSchema.safeParse(rawTmdbId);
  return parsed.success ? parsed.data : null;
};
