import { z } from "zod";
import { apiRequest } from "@/lib/api-client";

const movieInteractionSchema = z
  .object({
    liked: z.boolean(),
    watchlisted: z.boolean(),
    ratingOutOfFive: z.number().min(0.5).max(5).multipleOf(0.5).nullable(),
  })
  .passthrough();

const updateMovieInteractionInputSchema = z
  .object({
    liked: z.boolean().optional(),
    watchlisted: z.boolean().optional(),
    ratingOutOfFive: z.number().min(0.5).max(5).multipleOf(0.5).nullable().optional(),
  })
  .refine(
    (payload) =>
      payload.liked !== undefined ||
      payload.watchlisted !== undefined ||
      payload.ratingOutOfFive !== undefined,
    {
      message: "At least one interaction field is required",
    },
  );

export type MovieInteraction = z.infer<typeof movieInteractionSchema>;

export type UpdateMovieInteractionInput = z.infer<
  typeof updateMovieInteractionInputSchema
>;

export const getMovieInteraction = async (
  tmdbId: number,
): Promise<MovieInteraction> => {
  const response = await apiRequest<unknown>(`/api/interactions/${tmdbId}`, {
    method: "GET",
  });

  return movieInteractionSchema.parse(response);
};

export const updateMovieInteraction = async (
  tmdbId: number,
  input: UpdateMovieInteractionInput,
): Promise<MovieInteraction> => {
  const payload = updateMovieInteractionInputSchema.parse(input);
  const response = await apiRequest<unknown, UpdateMovieInteractionInput>(
    `/api/interactions/${tmdbId}`,
    {
      method: "PUT",
      body: payload,
    },
  );

  return movieInteractionSchema.parse(response);
};
