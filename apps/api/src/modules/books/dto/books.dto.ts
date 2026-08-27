import { z } from "zod";
import { isoDateSchema } from "../../../commons/validation/common.schemas";
import {
  DEFAULT_ARCHIVE_LIMIT,
  DEFAULT_ARCHIVE_PAGE,
  DEFAULT_ARCHIVE_SORT,
  MAX_ARCHIVE_LIMIT,
} from "../constants/books.constants";

export const booksArchiveSortValues = [
  "trending",
  "logs_desc",
  "published_desc",
  "published_asc",
  "rating_desc",
  "title_asc",
] as const;
export type BooksArchiveSort = (typeof booksArchiveSortValues)[number];

export const bookDetailReviewSortValues = ["popular", "recent"] as const;
export type BookDetailReviewSort = (typeof bookDetailReviewSortValues)[number];

export const SearchBooksQuerySchema = z.object({
  query: z.string().trim().min(1),
  language: z.string().optional(),
});
export type SearchBooksQuery = z.input<typeof SearchBooksQuerySchema>;

export const BookParamsSchema = z.object({
  volumeId: z.string().min(1),
});
export type BookParams = z.input<typeof BookParamsSchema>;

export const BookDetailQuerySchema = z.object({
  reviewsSort: z.enum(bookDetailReviewSortValues).optional(),
});
export type BookDetailQuery = z.input<typeof BookDetailQuerySchema>;

const optionalText = z.string().optional().transform((v) => v?.trim() || undefined);

const archiveSortSchema = optionalText.transform((v): BooksArchiveSort => {
  return (booksArchiveSortValues as readonly string[]).includes(v ?? "")
    ? (v as BooksArchiveSort)
    : DEFAULT_ARCHIVE_SORT;
});

const archivePageSchema = z.string().optional().transform((v) => {
  if (!v) return DEFAULT_ARCHIVE_PAGE;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? Math.max(1, n) : DEFAULT_ARCHIVE_PAGE;
});

const archiveLimitSchema = z.string().optional().transform((v) => {
  if (!v) return DEFAULT_ARCHIVE_LIMIT;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? Math.max(1, Math.min(MAX_ARCHIVE_LIMIT, n)) : DEFAULT_ARCHIVE_LIMIT;
});

export const BooksArchiveQuerySchema = z.object({
  genre: optionalText,
  language: optionalText,
  sort: archiveSortSchema,
  page: archivePageSchema,
  limit: archiveLimitSchema,
});

export const CreateBookLogSchema = z.object({
  readDate: isoDateSchema,
  rating: z.number().min(0.5).max(10).multipleOf(0.5).optional(),
  reread: z.boolean().optional(),
});

export const UpdateBookLogSchema = z.object({
  readDate: isoDateSchema.optional(),
  rating: z.number().min(0.5).max(10).multipleOf(0.5).nullable().optional(),
  reread: z.boolean().optional(),
});

export const UpdateBookInteractionSchema = z.object({
  liked: z.boolean().optional(),
  wantToRead: z.boolean().optional(),
  rating: z.number().min(0.5).max(10).multipleOf(0.5).nullable().optional(),
});

export type CreateBookLogDto = z.infer<typeof CreateBookLogSchema>;
export type UpdateBookLogDto = z.infer<typeof UpdateBookLogSchema>;
export type UpdateBookInteractionDto = z.infer<typeof UpdateBookInteractionSchema>;

export type NormalizedBooksArchiveQuery = {
  genre: string | null;
  language: string | null;
  sort: BooksArchiveSort;
  page: number;
  limit: number;
};

export const normalizeBooksArchiveQuery = (
  query: z.input<typeof BooksArchiveQuerySchema>,
): NormalizedBooksArchiveQuery => {
  const parsed = BooksArchiveQuerySchema.safeParse(query);
  if (!parsed.success) {
    return { genre: null, language: null, sort: DEFAULT_ARCHIVE_SORT, page: DEFAULT_ARCHIVE_PAGE, limit: DEFAULT_ARCHIVE_LIMIT };
  }
  return {
    genre: parsed.data.genre?.trim() || null,
    language: parsed.data.language?.trim() || null,
    sort: parsed.data.sort,
    page: parsed.data.page,
    limit: parsed.data.limit,
  };
};

export const normalizeBookDetailQuery = (
  query: BookDetailQuery,
): { reviewsSort: BookDetailReviewSort } => ({
  reviewsSort: query.reviewsSort ?? "popular",
});

export const parseVolumeIdParam = (raw: unknown): string | null => {
  if (typeof raw !== "string" || !raw.trim()) return null;
  return raw.trim();
};
