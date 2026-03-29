import { z } from "zod";
import {
  FAVORITE_GENRES,
  MAX_FAVORITE_GENRES,
} from "../constants/favorite-genres.constants";
import { ThemeIdInputSchema } from "../constants/theme.constants";

const FavoriteGenreSchema = z.enum(FAVORITE_GENRES);

export const UpdateProfileSchema = z.object({
  bio: z.string().max(300).optional(),
  location: z.string().max(100).optional(),
  avatarUrl: z.url().optional(),
  backdropUrl: z.url().optional(),
  top4MovieIds: z.array(z.number().int().positive()).max(4).optional(),
  favoriteGenres: z
    .array(FavoriteGenreSchema)
    .max(MAX_FAVORITE_GENRES)
    .refine((genres) => new Set(genres).size === genres.length, {
      message: "Favorite genres must be unique",
    })
    .optional(),
});

export const UpdateThemeSchema = z
  .union([
    z.object({ themeId: ThemeIdInputSchema }),
    z.object({ theme: ThemeIdInputSchema }),
  ])
  .transform((payload) => ({
    themeId: "themeId" in payload ? payload.themeId : payload.theme,
  }));

export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;
export type UpdateThemeDto = z.infer<typeof UpdateThemeSchema>;
