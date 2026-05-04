import { z } from "zod";
import type { Movie, MovieLog, TmdbSearchMovie } from "@/types/api";
import {
  archiveMovieSchema,
  archivePeriodSchema,
  archiveSortSchema,
  movieArchiveResponseSchema,
  movieDetailResponseSchema,
  movieDetailReviewSortSchema,
} from "./schemas";

export type { Movie, MovieLog, TmdbSearchMovie };

export type MovieArchiveSort = z.infer<typeof archiveSortSchema>;
export type MovieArchivePeriod = z.infer<typeof archivePeriodSchema>;
export type MovieDetailReviewSort = z.infer<typeof movieDetailReviewSortSchema>;

export type ArchiveMovie = z.infer<typeof archiveMovieSchema>;
export type MovieArchiveResponse = z.infer<typeof movieArchiveResponseSchema>;
export type MovieDetailResponse = z.infer<typeof movieDetailResponseSchema>;

export type QueryRequestOptions = {
  signal?: AbortSignal;
};

export type MovieArchiveInput = {
  genre?: string;
  language?: string;
  sort?: MovieArchiveSort;
  period?: MovieArchivePeriod;
  page?: number;
  limit?: number;
};

export type MovieDetailInput = {
  reviewsSort?: MovieDetailReviewSort;
};
