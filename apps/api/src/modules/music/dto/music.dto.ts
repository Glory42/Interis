import { z } from "zod";
import { isoDateSchema } from "../../../commons/validation/common.schemas";
import {
  DEFAULT_ARCHIVE_LIMIT,
  DEFAULT_ARCHIVE_PAGE,
  DEFAULT_ARCHIVE_SORT,
  MAX_ARCHIVE_LIMIT,
} from "../constants/music.constants";

export const musicArchiveSortValues = [
  "popular_lastfm",
  "logs_desc",
  "release_desc",
  "release_asc",
  "rating_desc",
  "title_asc",
] as const;
export type MusicArchiveSort = (typeof musicArchiveSortValues)[number];

export const musicDetailReviewSortValues = ["popular", "recent"] as const;
export type MusicDetailReviewSort = (typeof musicDetailReviewSortValues)[number];

export const SearchMusicQuerySchema = z.object({
  query: z.string().trim().min(1),
});
export type SearchMusicQuery = z.input<typeof SearchMusicQuerySchema>;

export const MusicParamsSchema = z.object({
  mbid: z.string().uuid(),
});
export type MusicParams = z.input<typeof MusicParamsSchema>;

export const MusicDetailQuerySchema = z.object({
  reviewsSort: z.enum(musicDetailReviewSortValues).optional(),
});
export type MusicDetailQuery = z.input<typeof MusicDetailQuerySchema>;

const optionalText = z.string().optional().transform((v) => v?.trim() || undefined);

const archiveSortSchema = optionalText.transform((v): MusicArchiveSort => {
  return (musicArchiveSortValues as readonly string[]).includes(v ?? "")
    ? (v as MusicArchiveSort)
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

export const MusicArchiveQuerySchema = z.object({
  genre: optionalText,
  sort: archiveSortSchema,
  type: optionalText,
  page: archivePageSchema,
  limit: archiveLimitSchema,
});

export const CreateMusicLogSchema = z.object({
  listenedDate: isoDateSchema,
  rating: z.number().min(0.5).max(10).multipleOf(0.5).optional(),
  relisten: z.boolean().optional(),
});

export const UpdateMusicLogSchema = z.object({
  listenedDate: isoDateSchema.optional(),
  rating: z.number().min(0.5).max(10).multipleOf(0.5).nullable().optional(),
  relisten: z.boolean().optional(),
});

export const UpdateMusicInteractionSchema = z.object({
  liked: z.boolean().optional(),
  wantToListen: z.boolean().optional(),
  rating: z.number().min(0.5).max(10).multipleOf(0.5).nullable().optional(),
});

export type CreateMusicLogDto = z.infer<typeof CreateMusicLogSchema>;
export type UpdateMusicLogDto = z.infer<typeof UpdateMusicLogSchema>;
export type UpdateMusicInteractionDto = z.infer<typeof UpdateMusicInteractionSchema>;

export type NormalizedMusicArchiveQuery = {
  genre: string | null;
  type: string | null;
  sort: MusicArchiveSort;
  page: number;
  limit: number;
};

export const normalizeMusicArchiveQuery = (
  query: z.input<typeof MusicArchiveQuerySchema>,
): NormalizedMusicArchiveQuery => {
  const parsed = MusicArchiveQuerySchema.safeParse(query);
  if (!parsed.success) {
    return { genre: null, type: null, sort: DEFAULT_ARCHIVE_SORT, page: DEFAULT_ARCHIVE_PAGE, limit: DEFAULT_ARCHIVE_LIMIT };
  }
  return {
    genre: parsed.data.genre?.trim() || null,
    type: parsed.data.type?.trim() || null,
    sort: parsed.data.sort,
    page: parsed.data.page,
    limit: parsed.data.limit,
  };
};

export const normalizeMusicDetailQuery = (
  query: MusicDetailQuery,
): { reviewsSort: MusicDetailReviewSort } => ({
  reviewsSort: query.reviewsSort ?? "popular",
});

export const parseMbidParam = (raw: unknown): string | null => {
  if (typeof raw !== "string" || !raw.trim()) return null;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(raw.trim()) ? raw.trim() : null;
};
