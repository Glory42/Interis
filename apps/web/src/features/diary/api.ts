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

export const getMyMovieLogs = async (): Promise<DiaryEntry[]> => {
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
