import { z } from "zod";
import {
  cachedSeriesSchema,
  createSeriesLogInputSchema,
  createSeriesLogResponseSchema,
  seriesArchiveItemSchema,
  seriesArchivePeriodSchema,
  seriesArchiveResponseSchema,
  seriesArchiveSortSchema,
  seriesDetailResponseSchema,
  seriesDetailReviewSortSchema,
  seriesDiaryEntrySchema,
  seriesDiaryListSchema,
  seriesInteractionSchema,
  seriesLogSchema,
  seriesLogsListSchema,
  seriesReviewsPageResponseSchema,
  seriesSeasonDetailSchema,
  tmdbSearchSeriesSchema,
  trendingSeriesSchema,
  updateSeriesInteractionInputSchema,
  updateSeriesLogInputSchema,
} from "./schemas";

export type TmdbSearchSeries = z.infer<typeof tmdbSearchSeriesSchema>;
export type SeriesArchiveSort = z.infer<typeof seriesArchiveSortSchema>;
export type SeriesArchivePeriod = z.infer<typeof seriesArchivePeriodSchema>;
export type SeriesDetailReviewSort = z.infer<typeof seriesDetailReviewSortSchema>;
export type SeriesArchiveItem = z.infer<typeof seriesArchiveItemSchema>;
export type SeriesArchiveResponse = z.infer<typeof seriesArchiveResponseSchema>;
export type SeriesDetailResponse = z.infer<typeof seriesDetailResponseSchema>;
export type SeriesDetailViewerTracking = NonNullable<SeriesDetailResponse["viewerTracking"]>;
export type SeriesReviewsPageResponse = z.infer<typeof seriesReviewsPageResponseSchema>;
export type SeriesDetailReviewItem = SeriesDetailResponse["reviews"][number];
export type SeriesSeasonDetailResponse = z.infer<typeof seriesSeasonDetailSchema>;
export type CachedSeries = z.infer<typeof cachedSeriesSchema>;
export type TrendingSeries = z.infer<typeof trendingSeriesSchema>;
export type SeriesInteraction = z.infer<typeof seriesInteractionSchema>;
export type SeriesWatchStatus = NonNullable<SeriesInteraction["watchStatus"]>;
export type UpdateSeriesInteractionInput = z.infer<
  typeof updateSeriesInteractionInputSchema
>;
export type CreateSeriesLogInput = z.infer<typeof createSeriesLogInputSchema>;
export type CreateSeriesLogResponse = z.infer<typeof createSeriesLogResponseSchema>;

export type { QueryRequestOptions } from "@/lib/api-client";

export type SeriesArchiveInput = {
  genre?: string;
  language?: string;
  sort?: SeriesArchiveSort;
  period?: SeriesArchivePeriod;
  page?: number;
  limit?: number;
};

export type SeriesDetailInput = {
  reviewsSort?: SeriesDetailReviewSort;
};

export type SeriesReviewsInput = {
  sort?: SeriesDetailReviewSort;
  page?: number;
  limit?: number;
};

export type SeriesDiaryEntry = z.infer<typeof seriesDiaryEntrySchema>;
export type SeriesDiaryList = z.infer<typeof seriesDiaryListSchema>;
export type SeriesLog = z.infer<typeof seriesLogSchema>;
export type SeriesLogsList = z.infer<typeof seriesLogsListSchema>;
export type UpdateSeriesLogInput = z.infer<typeof updateSeriesLogInputSchema>;
