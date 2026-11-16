import { z } from "zod";
import { apiRequest } from "@/lib/api-client";
import {
  createDiaryEntryInputSchema,
  createDiaryEntryResponseSchema,
  diaryEntrySchema,
  type CreateDiaryEntryInput,
  type CreateDiaryEntryResponse,
  type DiaryEntry,
} from "@/types/api";

const diaryListSchema = z.array(diaryEntrySchema);

export const getMyFilmLogs = async (): Promise<DiaryEntry[]> => {
  const response = await apiRequest<unknown>("/api/diary", {
    method: "GET",
  });

  return diaryListSchema.parse(response);
};

export const createDiaryEntry = async (
  input: CreateDiaryEntryInput,
): Promise<CreateDiaryEntryResponse> => {
  const payload = createDiaryEntryInputSchema.parse(input);

  const response = await apiRequest<unknown, CreateDiaryEntryInput>("/api/diary", {
    method: "POST",
    body: payload,
  });

  return createDiaryEntryResponseSchema.parse(response);
};

export type UpdateDiaryEntryInput = {
  watchedDate?: string;
  rating?: number | null;
  rewatch?: boolean;
  // Text writes the attached Review, null or blank deletes it, omitted leaves it.
  review?: string | null;
  containsSpoilers?: boolean;
  // Null or blank clears the private note; tags replace the whole set.
  note?: string | null;
  tags?: string[];
};

// What only a log's owner sees besides the log itself.
export const logPrivateFieldsSchema = z.object({
  note: z.string().nullable(),
  tags: z.array(z.string()),
});

export type LogPrivateFields = z.infer<typeof logPrivateFieldsSchema>;

export const getLogPrivateFields = async (
  kind: "film" | "tv",
  logId: string,
  options: { signal?: AbortSignal } = {},
): Promise<LogPrivateFields> => {
  const path = kind === "film" ? `/api/diary/${encodeURIComponent(logId)}` : `/api/serials/logs/${encodeURIComponent(logId)}`;
  const response = await apiRequest<unknown>(path, { method: "GET", signal: options.signal });
  const { note, tags } = logPrivateFieldsSchema.parse(response);
  return { note, tags };
};

export const diaryTagCountSchema = z.object({ tag: z.string(), count: z.number().int() });
export type DiaryTagCount = z.infer<typeof diaryTagCountSchema>;

// A user's Diary Tags, most used first (public, bounded server-side).
export const getUserDiaryTags = async (
  username: string,
  limit: number,
  options: { signal?: AbortSignal } = {},
): Promise<DiaryTagCount[]> => {
  const response = await apiRequest<unknown>(
    `/api/users/${encodeURIComponent(username)}/diary/tags?limit=${limit}`,
    { method: "GET", cache: "no-store", signal: options.signal },
  );
  return z.array(diaryTagCountSchema).parse(response);
};

export const updateDiaryEntry = async (
  entryId: string,
  input: UpdateDiaryEntryInput,
): Promise<void> => {
  await apiRequest<unknown, UpdateDiaryEntryInput>(`/api/diary/${encodeURIComponent(entryId)}`, {
    method: "PUT",
    body: input,
  });
};

// `unwatch` also marks the movie not watched when this is the user's last
// log of it; the server leaves it watched while another log remains.
export const deleteDiaryEntry = async (
  entryId: string,
  options: { unwatch?: boolean } = {},
): Promise<void> => {
  const query = options.unwatch ? "?unwatch=true" : "";
  await apiRequest<unknown>(`/api/diary/${encodeURIComponent(entryId)}${query}`, {
    method: "DELETE",
  });
};
