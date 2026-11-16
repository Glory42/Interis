import { z } from "zod";
import { MEDIA_TYPES } from "../../media/constants/media-type.constant";
import { ONBOARDING_TASTE_MAX_ITEMS } from "../constants/onboarding.constants";

const tasteItemSchema = z.object({
  mediaType: z.enum(MEDIA_TYPES),
  tmdbId: z.number().int().positive(),
  watched: z.boolean(),
  // Omitted keeps the current rating; null clears it.
  rating: z.number().min(0.5).max(10).multipleOf(0.5).nullable().optional(),
});

// The whole taste grid in one request; one entry per title.
export const SaveTasteSchema = z.object({
  items: z
    .array(tasteItemSchema)
    .min(1)
    .max(ONBOARDING_TASTE_MAX_ITEMS)
    .refine(
      (items) => new Set(items.map((item) => `${item.mediaType}:${item.tmdbId}`)).size === items.length,
      { message: "Each title may appear once" },
    ),
});

export type TasteItemDto = z.infer<typeof tasteItemSchema>;
export type SaveTasteDto = z.infer<typeof SaveTasteSchema>;
