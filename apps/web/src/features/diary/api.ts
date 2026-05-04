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

export const getMyDiary = async (): Promise<DiaryEntry[]> => {
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
