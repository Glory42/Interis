import { z } from "zod";
import { paginationQuerySchema } from "../../../commons/validation/common.schemas";

export const AdminListMediaQuerySchema = z.object({
  query: z.string().trim().optional(),
  ...paginationQuerySchema.shape,
});

export type AdminListMediaQuery = z.input<typeof AdminListMediaQuerySchema>;

export const AdminMediaIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type AdminMediaIdParams = z.input<typeof AdminMediaIdParamsSchema>;

export const AdminUpdateMovieSchema = z.object({
  title: z.string().trim().min(1).optional(),
  originalTitle: z.string().trim().nullable().optional(),
  overview: z.string().trim().nullable().optional(),
  tagline: z.string().trim().nullable().optional(),
  director: z.string().trim().nullable().optional(),
  posterPath: z.string().trim().nullable().optional(),
  backdropPath: z.string().trim().nullable().optional(),
  releaseYear: z.number().int().nullable().optional(),
});

export const AdminUpdateSerialSchema = z.object({
  title: z.string().trim().min(1).optional(),
  originalTitle: z.string().trim().nullable().optional(),
  overview: z.string().trim().nullable().optional(),
  tagline: z.string().trim().nullable().optional(),
  creator: z.string().trim().nullable().optional(),
  network: z.string().trim().nullable().optional(),
  posterPath: z.string().trim().nullable().optional(),
  backdropPath: z.string().trim().nullable().optional(),
});
