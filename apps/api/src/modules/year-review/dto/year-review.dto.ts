import { z } from "zod";

export const YEAR_REVIEW_MIN_YEAR = 2000;

// The current calendar year in UTC, the latest one with a Year in Review.
export const currentYearReviewYear = (now = new Date()): number => now.getUTCFullYear();

// Checked at request time so the upper bound moves with the calendar.
export const YearReviewParamsSchema = z.object({
  username: z.string().min(1).max(64),
  year: z.coerce
    .number()
    .int()
    .min(YEAR_REVIEW_MIN_YEAR)
    .refine((year) => year <= currentYearReviewYear(), { message: "Year is in the future" }),
});
