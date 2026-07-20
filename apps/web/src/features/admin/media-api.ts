import { z } from "zod";
import { apiRequest } from "@/lib/api-client";

const actionResponseSchema = z.object({ success: z.boolean() });

const buildMediaQuery = (query: string | undefined): string => {
  if (!query) return "";
  return `?query=${encodeURIComponent(query)}`;
};

const adminMovieSchema = z.object({
  id: z.number(),
  tmdbId: z.number(),
  title: z.string(),
  originalTitle: z.string().nullable(),
  posterPath: z.string().nullable(),
  releaseYear: z.number().nullable(),
  director: z.string().nullable(),
  cachedAt: z.coerce.date(),
});
export type AdminMovie = z.infer<typeof adminMovieSchema>;

export type AdminUpdateMovieInput = Partial<{
  title: string;
  originalTitle: string | null;
  overview: string | null;
  tagline: string | null;
  director: string | null;
  posterPath: string | null;
  backdropPath: string | null;
  releaseYear: number | null;
}>;

export const listAdminMovies = async (query?: string): Promise<AdminMovie[]> => {
  const response = await apiRequest<unknown>(`/api/admin/movies${buildMediaQuery(query)}`, {
    method: "GET",
  });
  return z.array(adminMovieSchema).parse(response);
};

export const updateAdminMovie = async (
  id: number,
  fields: AdminUpdateMovieInput,
): Promise<void> => {
  await apiRequest<unknown, AdminUpdateMovieInput>(`/api/admin/movies/${id}`, {
    method: "PATCH",
    body: fields,
  });
};

export const refreshAdminMovie = async (id: number): Promise<void> => {
  await apiRequest<unknown>(`/api/admin/movies/${id}/refresh`, { method: "POST" });
};

export const deleteAdminMovie = async (id: number): Promise<void> => {
  const response = await apiRequest<unknown>(`/api/admin/movies/${id}`, { method: "DELETE" });
  actionResponseSchema.parse(response);
};

const adminSerialSchema = z.object({
  id: z.number(),
  tmdbId: z.number(),
  title: z.string(),
  originalTitle: z.string().nullable(),
  posterPath: z.string().nullable(),
  firstAirYear: z.number().nullable(),
  creator: z.string().nullable(),
  cachedAt: z.coerce.date(),
});
export type AdminSerial = z.infer<typeof adminSerialSchema>;

export type AdminUpdateSerialInput = Partial<{
  title: string;
  originalTitle: string | null;
  overview: string | null;
  tagline: string | null;
  creator: string | null;
  network: string | null;
  posterPath: string | null;
  backdropPath: string | null;
}>;

export const listAdminSerials = async (query?: string): Promise<AdminSerial[]> => {
  const response = await apiRequest<unknown>(`/api/admin/serials${buildMediaQuery(query)}`, {
    method: "GET",
  });
  return z.array(adminSerialSchema).parse(response);
};

export const updateAdminSerial = async (
  id: number,
  fields: AdminUpdateSerialInput,
): Promise<void> => {
  await apiRequest<unknown, AdminUpdateSerialInput>(`/api/admin/serials/${id}`, {
    method: "PATCH",
    body: fields,
  });
};

export const refreshAdminSerial = async (id: number): Promise<void> => {
  await apiRequest<unknown>(`/api/admin/serials/${id}/refresh`, { method: "POST" });
};

export const deleteAdminSerial = async (id: number): Promise<void> => {
  const response = await apiRequest<unknown>(`/api/admin/serials/${id}`, { method: "DELETE" });
  actionResponseSchema.parse(response);
};
