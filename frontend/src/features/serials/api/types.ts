import { z } from "zod";
import {
  cachedSeriesSchema,
  createSeriesLogInputSchema,
  createSeriesLogResponseSchema,
  serialArchiveItemSchema,
  serialArchivePeriodSchema,
  serialArchiveResponseSchema,
  serialArchiveSortSchema,
  serialDetailResponseSchema,
  serialDetailReviewSortSchema,
  serialInteractionSchema,
  serialSeasonDetailSchema,
  tmdbSearchSeriesSchema,
  trendingSeriesSchema,
  updateSerialInteractionInputSchema,
} from "./schemas";

export type TmdbSearchSeries = z.infer<typeof tmdbSearchSeriesSchema>;
export type SerialArchiveSort = z.infer<typeof serialArchiveSortSchema>;
export type SerialArchivePeriod = z.infer<typeof serialArchivePeriodSchema>;
export type SerialDetailReviewSort = z.infer<typeof serialDetailReviewSortSchema>;
export type SerialArchiveItem = z.infer<typeof serialArchiveItemSchema>;
export type SerialArchiveResponse = z.infer<typeof serialArchiveResponseSchema>;
export type SerialDetailResponse = z.infer<typeof serialDetailResponseSchema>;
export type SerialSeasonDetailResponse = z.infer<typeof serialSeasonDetailSchema>;
export type CachedSeries = z.infer<typeof cachedSeriesSchema>;
export type TrendingSeries = z.infer<typeof trendingSeriesSchema>;
export type SerialInteraction = z.infer<typeof serialInteractionSchema>;
export type UpdateSerialInteractionInput = z.infer<
  typeof updateSerialInteractionInputSchema
>;
export type CreateSeriesLogInput = z.infer<typeof createSeriesLogInputSchema>;
export type CreateSeriesLogResponse = z.infer<typeof createSeriesLogResponseSchema>;

export type QueryRequestOptions = {
  signal?: AbortSignal;
};

export type SerialArchiveInput = {
  genre?: string;
  language?: string;
  sort?: SerialArchiveSort;
  period?: SerialArchivePeriod;
  page?: number;
  limit?: number;
};

export type SerialDetailInput = {
  reviewsSort?: SerialDetailReviewSort;
};
