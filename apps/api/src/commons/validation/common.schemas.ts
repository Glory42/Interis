import { z } from "zod";

export const tmdbIdSchema = z.coerce.number().int().positive();

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD");
