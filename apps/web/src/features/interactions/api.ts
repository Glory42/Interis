import { z } from "zod";
import { apiRequest } from "@/lib/api-client";

const filmInteractionSchema = z
  .object({
    liked: z.boolean(),
    watchlisted: z.boolean(),
    rating: z.number().min(0.5).max(10).multipleOf(0.5).nullable(),
    watched: z.boolean(),
  })
  .passthrough();

const updateFilmInteractionInputSchema = z
  .object({
    liked: z.boolean().optional(),
    watchlisted: z.boolean().optional(),
    rating: z.number().min(0.5).max(10).multipleOf(0.5).nullable().optional(),
    watched: z.boolean().optional(),
  })
  .refine(
    (payload) =>
      payload.liked !== undefined ||
      payload.watchlisted !== undefined ||
      payload.rating !== undefined ||
      payload.watched !== undefined,
    {
      message: "At least one interaction field is required",
    },
  );

export type FilmInteraction = z.infer<typeof filmInteractionSchema>;

export type UpdateFilmInteractionInput = z.infer<
  typeof updateFilmInteractionInputSchema
>;

export const getFilmInteraction = async (
  tmdbId: number,
): Promise<FilmInteraction> => {
  const response = await apiRequest<unknown>(`/api/interactions/${tmdbId}`, {
    method: "GET",
  });

  return filmInteractionSchema.parse(response);
};

export const updateFilmInteraction = async (
  tmdbId: number,
  input: UpdateFilmInteractionInput,
): Promise<FilmInteraction> => {
  const payload = updateFilmInteractionInputSchema.parse(input);
  const response = await apiRequest<unknown, UpdateFilmInteractionInput>(
    `/api/interactions/${tmdbId}`,
    {
      method: "PUT",
      body: payload,
    },
  );

  return filmInteractionSchema.parse(response);
};
