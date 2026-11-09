import { z } from "zod";
import { appendPageParams, type AdminPage } from "@/features/admin/pagination";
import { apiRequest } from "@/lib/api-client";
import { successResponseSchema as actionResponseSchema } from "@/types/api";

// Wire names: the admin API calls Films "movies" and Series "serials".
export type AdminMediaKind = "movie" | "serial";

// One cached Film or Series row, with its year and director/creator under shared names.
export type AdminMediaTitle = {
  id: number;
  tmdbId: number;
  title: string;
  year: number | null;
  credit: string | null;
};

export type AdminMediaUpdate = { title?: string; overview?: string; credit?: string | null };

const baseRow = { id: z.number(), tmdbId: z.number(), title: z.string() };

const ADMIN_MEDIA_API = {
  movie: {
    path: "/api/admin/movies",
    creditField: "director",
    row: z
      .object({ ...baseRow, releaseYear: z.number().nullable(), director: z.string().nullable() })
      .transform(({ releaseYear, director, ...row }) => ({ ...row, year: releaseYear, credit: director })),
  },
  serial: {
    path: "/api/admin/serials",
    creditField: "creator",
    row: z
      .object({ ...baseRow, firstAirYear: z.number().nullable(), creator: z.string().nullable() })
      .transform(({ firstAirYear, creator, ...row }) => ({ ...row, year: firstAirYear, credit: creator })),
  },
} as const;

const buildMediaQuery = (query: string | undefined, page?: AdminPage): string => {
  const params = new URLSearchParams();
  if (query) params.set("query", query);
  appendPageParams(params, page);
  const search = params.toString();
  return search ? `?${search}` : "";
};

export const listAdminMedia = async (
  kind: AdminMediaKind,
  query?: string,
  page?: AdminPage,
): Promise<AdminMediaTitle[]> => {
  const { path, row } = ADMIN_MEDIA_API[kind];
  const response = await apiRequest<unknown>(`${path}${buildMediaQuery(query, page)}`, { method: "GET" });
  return z.array(row).parse(response);
};

export const updateAdminMedia = async (
  kind: AdminMediaKind,
  id: number,
  { credit, ...fields }: AdminMediaUpdate,
): Promise<void> => {
  const { path, creditField } = ADMIN_MEDIA_API[kind];
  const body = credit === undefined ? fields : { ...fields, [creditField]: credit };
  await apiRequest<unknown, Record<string, unknown>>(`${path}/${id}`, { method: "PATCH", body });
};

export const refreshAdminMedia = async (kind: AdminMediaKind, id: number): Promise<void> => {
  await apiRequest<unknown>(`${ADMIN_MEDIA_API[kind].path}/${id}/refresh`, { method: "POST" });
};

export const deleteAdminMedia = async (kind: AdminMediaKind, id: number): Promise<void> => {
  const response = await apiRequest<unknown>(`${ADMIN_MEDIA_API[kind].path}/${id}`, { method: "DELETE" });
  actionResponseSchema.parse(response);
};
