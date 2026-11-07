import { z } from "zod";
import type { Film, FilmLog, TmdbSearchFilm } from "@/types/api";
import {
  archiveFilmSchema,
  archivePeriodSchema,
  archiveSortSchema,
  filmArchiveResponseSchema,
  filmDetailResponseSchema,
  filmDetailReviewSortSchema,
  filmReviewsPageResponseSchema,
} from "./schemas";

export type { Film, FilmLog, TmdbSearchFilm };

export type FilmArchiveSort = z.infer<typeof archiveSortSchema>;
export type FilmArchivePeriod = z.infer<typeof archivePeriodSchema>;
export type FilmDetailReviewSort = z.infer<typeof filmDetailReviewSortSchema>;

export type ArchiveFilm = z.infer<typeof archiveFilmSchema>;
export type FilmArchiveResponse = z.infer<typeof filmArchiveResponseSchema>;
export type FilmDetailResponse = z.infer<typeof filmDetailResponseSchema>;
export type FilmReviewsPageResponse = z.infer<typeof filmReviewsPageResponseSchema>;
export type FilmDetailReviewItem = FilmDetailResponse["reviews"][number];

export type { QueryRequestOptions } from "@/lib/api-client";

export type FilmArchiveInput = {
  genre?: string;
  language?: string;
  sort?: FilmArchiveSort;
  period?: FilmArchivePeriod;
  page?: number;
  limit?: number;
};

export type FilmDetailInput = {
  reviewsSort?: FilmDetailReviewSort;
};

export type FilmReviewsInput = {
  sort?: FilmDetailReviewSort;
  page?: number;
  limit?: number;
};
