import { z } from "zod";
import { appendPageParams, type AdminPage } from "@/features/admin/pagination";
import { apiRequest } from "@/lib/api-client";
import {
  mediaTypeSchema,
  successResponseSchema as actionResponseSchema,
  type MediaType,
} from "@/types/api";

export type AdminContentFilters = { username?: string; movieId?: number };
export type AdminDiaryFilters = AdminContentFilters & { mediaType?: MediaType };

const buildContentQuery = (filters: AdminDiaryFilters, page?: AdminPage): string => {
  const params = new URLSearchParams();
  if (filters.username) params.set("username", filters.username);
  if (filters.movieId) params.set("movieId", String(filters.movieId));
  if (filters.mediaType) params.set("mediaType", filters.mediaType);
  appendPageParams(params, page);
  const query = params.toString();
  return query ? `?${query}` : "";
};

const adminReviewSchema = z.object({
  id: z.string(),
  userId: z.string(),
  authorUsername: z.string(),
  mediaType: z.string(),
  movieId: z.number().nullable(),
  movieTitle: z.string().nullable(),
  content: z.string(),
  containsSpoilers: z.boolean(),
  createdAt: z.coerce.date(),
});
export type AdminReview = z.infer<typeof adminReviewSchema>;

export const listAdminReviews = async (
  filters: AdminContentFilters,
  page?: AdminPage,
): Promise<AdminReview[]> => {
  const response = await apiRequest<unknown>(`/api/admin/reviews${buildContentQuery(filters, page)}`, {
    method: "GET",
  });
  return z.array(adminReviewSchema).parse(response);
};

export const deleteAdminReview = async (id: string): Promise<void> => {
  const response = await apiRequest<unknown>(`/api/admin/reviews/${id}`, { method: "DELETE" });
  actionResponseSchema.parse(response);
};

const adminDiaryEntrySchema = z.object({
  id: z.string(),
  userId: z.string(),
  authorUsername: z.string(),
  watchedDate: z.string(),
  rating: z.number().nullable(),
  rewatch: z.boolean(),
  mediaType: mediaTypeSchema,
  mediaId: z.number(),
  mediaTitle: z.string(),
  createdAt: z.coerce.date(),
});
export type AdminDiaryEntry = z.infer<typeof adminDiaryEntrySchema>;

export const listAdminDiaryEntries = async (
  filters: AdminDiaryFilters,
  page?: AdminPage,
): Promise<AdminDiaryEntry[]> => {
  const response = await apiRequest<unknown>(`/api/admin/diary${buildContentQuery(filters, page)}`, {
    method: "GET",
  });
  return z.array(adminDiaryEntrySchema).parse(response);
};

export const deleteAdminDiaryEntry = async (
  entry: Pick<AdminDiaryEntry, "id" | "mediaType">,
): Promise<void> => {
  const response = await apiRequest<unknown>(
    `/api/admin/diary/${entry.id}?mediaType=${entry.mediaType}`,
    { method: "DELETE" },
  );
  actionResponseSchema.parse(response);
};

const adminPostSchema = z.object({
  id: z.string(),
  userId: z.string(),
  authorUsername: z.string(),
  content: z.string(),
  mediaId: z.number().nullable(),
  mediaType: mediaTypeSchema.nullable(),
  createdAt: z.coerce.date(),
});
export type AdminPost = z.infer<typeof adminPostSchema>;

export const listAdminPosts = async (
  filters: Pick<AdminContentFilters, "username">,
  page?: AdminPage,
): Promise<AdminPost[]> => {
  const response = await apiRequest<unknown>(`/api/admin/posts${buildContentQuery(filters, page)}`, {
    method: "GET",
  });
  return z.array(adminPostSchema).parse(response);
};

export const deleteAdminPost = async (id: string): Promise<void> => {
  const response = await apiRequest<unknown>(`/api/admin/posts/${id}`, { method: "DELETE" });
  actionResponseSchema.parse(response);
};
