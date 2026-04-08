import { z } from "zod";
import {
  FAVORITE_GENRES,
  MAX_FAVORITE_GENRES,
} from "../constants/favorite-genres.constants";
import {
  MAX_TOP_PICK_ITEMS_PER_CATEGORY,
  TOP_PICK_CATEGORY_ID_SET,
  TOP_PICK_DEFAULT_MEDIA_TYPE,
  TOP_PICK_MEDIA_TYPE_SET,
  type TopPickCategoryId,
  type TopPickMediaType,
} from "../constants/top-picks.constants";
import { ThemeIdInputSchema } from "../constants/theme.constants";

const FavoriteGenreSchema = z.enum(FAVORITE_GENRES);

const TopPickCategoryIdSchema = z
  .number()
  .int()
  .refine(
    (value): value is TopPickCategoryId => TOP_PICK_CATEGORY_ID_SET.has(value),
    {
      message: "Invalid top pick category",
    },
  );

const TopPickMediaTypeSchema = z
  .string()
  .refine(
    (value): value is TopPickMediaType => TOP_PICK_MEDIA_TYPE_SET.has(value),
    {
      message: "Invalid top pick media type",
    },
  );

const TopPickItemSchema = z.object({
  slot: z.number().int().min(1).max(MAX_TOP_PICK_ITEMS_PER_CATEGORY),
  mediaType: TopPickMediaTypeSchema,
  mediaSource: z.string().trim().min(1).max(32),
  mediaSourceId: z.string().trim().min(1).max(128),
  title: z.string().trim().max(200).optional(),
  posterPath: z.string().trim().max(500).nullable().optional(),
  releaseYear: z.number().int().min(1800).max(2200).nullable().optional(),
});

const TopPickCategorySchema = z
  .object({
    categoryId: TopPickCategoryIdSchema,
    items: z.array(TopPickItemSchema).max(MAX_TOP_PICK_ITEMS_PER_CATEGORY),
  })
  .superRefine((category, ctx) => {
    const expectedMediaType = TOP_PICK_DEFAULT_MEDIA_TYPE[category.categoryId];

    const seenSlots = new Set<number>();
    const seenMediaSources = new Set<string>();

    for (const item of category.items) {
      if (item.mediaType !== expectedMediaType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Category ${category.categoryId} expects media type ${expectedMediaType}`,
        });
      }

      if (seenSlots.has(item.slot)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Top pick slots must be unique per category",
        });
      }
      seenSlots.add(item.slot);

      const dedupeKey = `${item.mediaSource}:${item.mediaSourceId}`;
      if (seenMediaSources.has(dedupeKey)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Duplicate top picks are not allowed in the same category",
        });
      }
      seenMediaSources.add(dedupeKey);
    }
  });

const TopPicksSchema = z
  .array(TopPickCategorySchema)
  .max(4)
  .superRefine((categories, ctx) => {
    const seenCategoryIds = new Set<number>();

    for (const category of categories) {
      if (seenCategoryIds.has(category.categoryId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Top pick categories must be unique",
        });
      }
      seenCategoryIds.add(category.categoryId);
    }
  });

export const UpdateProfileSchema = z.object({
  bio: z.string().max(300).optional(),
  location: z.string().max(100).optional(),
  avatarUrl: z.url().optional(),
  topPicks: TopPicksSchema.optional(),
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

export const SearchUsersQuerySchema = z.object({
  query: z.string().trim().min(1).max(32),
  limit: z.coerce.number().int().min(1).max(20).optional(),
});

export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;
export type UpdateThemeDto = z.infer<typeof UpdateThemeSchema>;
export type SearchUsersQueryDto = z.infer<typeof SearchUsersQuerySchema>;
export type UpdateTopPicksInput = z.infer<typeof TopPicksSchema>;
