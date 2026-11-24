import { z } from "zod";

// Schemas in src/types mirror apps/web/src/types/api.ts and the web feature
// schemas - both clients validate the same backend responses.

export const MEDIA_TYPES = ["movie", "tv"] as const;
export const mediaTypeSchema = z.enum(MEDIA_TYPES);
export type MediaType = z.infer<typeof mediaTypeSchema>;

export const successResponseSchema = z.object({ success: z.boolean() });

export const userSummarySchema = z.object({
  id: z.string(),
  username: z.string(),
  displayUsername: z.string().nullable(),
  avatarUrl: z.string().nullable(),
});
export type UserSummary = z.infer<typeof userSummarySchema>;

export const genreSchema = z.object({
  id: z.number().int(),
  name: z.string(),
});
export type Genre = z.infer<typeof genreSchema>;

export const personLinkSchema = z.object({
  tmdbPersonId: z.number().int().positive(),
  slug: z.string(),
  name: z.string(),
  profilePath: z.string().nullable(),
  knownForDepartment: z.string().nullable(),
  routeRole: z.enum(["actor", "director"]),
  character: z.string().nullable(),
  job: z.string().nullable(),
  department: z.string().nullable(),
});
export type PersonLink = z.infer<typeof personLinkSchema>;

export const ratingBreakdownSchema = z.object({
  totalRatedReviews: z.number().int().nonnegative(),
  averageRating: z.number().nullable(),
  buckets: z.array(
    z.object({
      ratingValue: z.number().int().min(1).max(10),
      count: z.number().int().nonnegative(),
      percentage: z.number().int().min(0).max(100),
    }),
  ),
});

export const viewerUserRatingSchema = z
  .object({
    diaryEntryId: z.string().nullable(),
    reviewId: z.string().nullable(),
    watchedDate: z.string().nullable(),
    rewatch: z.boolean(),
    rating: z.number().nullable(),
    reviewContent: z.string().nullable(),
    reviewContainsSpoilers: z.boolean().nullable(),
  })
  .nullable();

export const reviewSortSchema = z.enum(["popular", "recent"]);
export type ReviewSort = z.infer<typeof reviewSortSchema>;

export const archivePeriodSchema = z.enum([
  "all_time",
  "this_year",
  "last_10_years",
  "this_week",
  "today",
]);
export type ArchivePeriod = z.infer<typeof archivePeriodSchema>;

export const archiveGenreCountSchema = z.object({
  id: z.number().int().nullable().optional(),
  name: z.string(),
  count: z.number().int().nonnegative().nullable(),
});

export const ratingValueSchema = z.number().min(0.5).max(10).multipleOf(0.5);
