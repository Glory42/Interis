import { z } from "zod";
import {
  bookDetailSchema,
  booksArchiveItemSchema,
  booksArchiveResponseSchema,
  bookDetailResponseSchema,
  bookInteractionSchema,
  bookLogItemSchema,
  myBookLogSchema,
  updateBookLogInputSchema,
  createBookLogInputSchema,
  updateBookInteractionInputSchema,
  googleBooksVolumeSchema,
} from "./schemas";

export type GoogleBooksVolume = z.infer<typeof googleBooksVolumeSchema>;
export type BookDetail = z.infer<typeof bookDetailSchema>;
export type BooksArchiveItem = z.infer<typeof booksArchiveItemSchema>;
export type BooksArchiveResponse = z.infer<typeof booksArchiveResponseSchema>;
export type BookDetailResponse = z.infer<typeof bookDetailResponseSchema>;
export type BookInteraction = z.infer<typeof bookInteractionSchema>;
export type BookLogItem = z.infer<typeof bookLogItemSchema>;
export type MyBookLog = z.infer<typeof myBookLogSchema>;
export type UpdateBookLogInput = z.infer<typeof updateBookLogInputSchema>;
export type CreateBookLogInput = z.infer<typeof createBookLogInputSchema>;
export type UpdateBookInteractionInput = z.infer<typeof updateBookInteractionInputSchema>;

export type BooksArchiveSort =
  | "logs_desc"
  | "published_desc"
  | "published_asc"
  | "rating_desc"
  | "title_asc";

export type BookDetailReviewSort = "popular" | "recent";

export type QueryRequestOptions = {
  signal?: AbortSignal;
};

export type BooksArchiveInput = {
  genre?: string;
  language?: string;
  sort?: BooksArchiveSort;
  page?: number;
  limit?: number;
};

export type BookDetailInput = {
  reviewsSort?: BookDetailReviewSort;
};
