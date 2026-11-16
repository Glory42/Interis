import { z } from "zod";
import { apiRequest, type QueryRequestOptions } from "@/lib/api-client";
import { mediaTypeSchema } from "@/types/api";

const onboardingTitleSchema = z.object({
  mediaType: mediaTypeSchema,
  tmdbId: z.number().int(),
  title: z.string(),
  posterPath: z.string().nullable(),
  year: z.number().int().nullable(),
});

const saveTasteResponseSchema = z.object({
  saved: z.number().int(),
  failed: z.array(onboardingTitleSchema.pick({ mediaType: true, tmdbId: true })),
});

export type OnboardingTitle = z.infer<typeof onboardingTitleSchema>;

export type TasteItem = Pick<OnboardingTitle, "mediaType" | "tmdbId"> & {
  watched: boolean;
  rating?: number | null;
};

export const getOnboardingTitles = async (
  options: QueryRequestOptions = {},
): Promise<OnboardingTitle[]> => {
  const response = await apiRequest<unknown>("/api/onboarding/titles", {
    method: "GET",
    signal: options.signal,
  });
  return z.object({ items: z.array(onboardingTitleSchema) }).parse(response).items;
};

// One request for the whole grid; a Series watched cascades to its seasons, so allow time.
export const saveTaste = async (items: TasteItem[]) => {
  const response = await apiRequest<unknown, { items: TasteItem[] }>("/api/onboarding/taste", {
    method: "POST",
    body: { items },
    timeoutMs: 30_000,
  });
  return saveTasteResponseSchema.parse(response);
};

export const completeOnboarding = async (): Promise<string> => {
  const response = await apiRequest<unknown>("/api/onboarding/complete", { method: "POST" });
  return z.object({ onboardingCompletedAt: z.string() }).parse(response).onboardingCompletedAt;
};
