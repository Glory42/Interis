import { z } from "zod";
import { appendPageParams, type AdminPage } from "@/features/admin/pagination";
import { apiRequest } from "@/lib/api-client";
import { successResponseSchema as actionResponseSchema } from "@/types/api";

const buildMediaQuery = (query: string | undefined, page?: AdminPage): string => {
  const params = new URLSearchParams();
  if (query) params.set("query", query);
  appendPageParams(params, page);
  const search = params.toString();
  return search ? `?${search}` : "";
};

const adminFilmSchema = z.object({
  id: z.number(),
  tmdbId: z.number(),
  title: z.string(),
  originalTitle: z.string().nullable(),
  posterPath: z.string().nullable(),
  releaseYear: z.number().nullable(),
  director: z.string().nullable(),
  cachedAt: z.coerce.date(),
});
export type AdminFilm = z.infer<typeof adminFilmSchema>;

export type AdminUpdateFilmInput = Partial<{
  title: string;
  originalTitle: string | null;
  overview: string | null;
  tagline: string | null;
  director: string | null;
  posterPath: string | null;
  backdropPath: string | null;
  releaseYear: number | null;
}>;

export const listAdminFilms = async (query?: string, page?: AdminPage): Promise<AdminFilm[]> => {
  const response = await apiRequest<unknown>(`/api/admin/movies${buildMediaQuery(query, page)}`, {
    method: "GET",
  });
  return z.array(adminFilmSchema).parse(response);
};

export const updateAdminFilm = async (
  id: number,
  fields: AdminUpdateFilmInput,
): Promise<void> => {
  await apiRequest<unknown, AdminUpdateFilmInput>(`/api/admin/movies/${id}`, {
    method: "PATCH",
    body: fields,
  });
};

export const refreshAdminFilm = async (id: number): Promise<void> => {
  await apiRequest<unknown>(`/api/admin/movies/${id}/refresh`, { method: "POST" });
};

export const deleteAdminFilm = async (id: number): Promise<void> => {
  const response = await apiRequest<unknown>(`/api/admin/movies/${id}`, { method: "DELETE" });
  actionResponseSchema.parse(response);
};

const adminSeriesSchema = z.object({
  id: z.number(),
  tmdbId: z.number(),
  title: z.string(),
  originalTitle: z.string().nullable(),
  posterPath: z.string().nullable(),
  firstAirYear: z.number().nullable(),
  creator: z.string().nullable(),
  cachedAt: z.coerce.date(),
});
export type AdminSeries = z.infer<typeof adminSeriesSchema>;

export type AdminUpdateSeriesInput = Partial<{
  title: string;
  originalTitle: string | null;
  overview: string | null;
  tagline: string | null;
  creator: string | null;
  network: string | null;
  posterPath: string | null;
  backdropPath: string | null;
}>;

export const listAdminTv = async (query?: string, page?: AdminPage): Promise<AdminSeries[]> => {
  const response = await apiRequest<unknown>(`/api/admin/serials${buildMediaQuery(query, page)}`, {
    method: "GET",
  });
  return z.array(adminSeriesSchema).parse(response);
};

export const updateAdminSeries = async (
  id: number,
  fields: AdminUpdateSeriesInput,
): Promise<void> => {
  await apiRequest<unknown, AdminUpdateSeriesInput>(`/api/admin/serials/${id}`, {
    method: "PATCH",
    body: fields,
  });
};

export const refreshAdminSeries = async (id: number): Promise<void> => {
  await apiRequest<unknown>(`/api/admin/serials/${id}/refresh`, { method: "POST" });
};

export const deleteAdminSeries = async (id: number): Promise<void> => {
  const response = await apiRequest<unknown>(`/api/admin/serials/${id}`, { method: "DELETE" });
  actionResponseSchema.parse(response);
};
