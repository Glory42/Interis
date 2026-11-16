import { z } from "zod";
import { tmdbIdSchema } from "./common.schemas";

export const parseTmdbIdParam = (rawTmdbId: unknown): number | null => {
  const parsed = tmdbIdSchema.safeParse(rawTmdbId);
  return parsed.success ? parsed.data : null;
};

// Guards uuid route params before they reach a uuid column (Postgres rejects a malformed one).
export const isUuid = (raw: unknown): raw is string => z.uuid().safeParse(raw).success;
