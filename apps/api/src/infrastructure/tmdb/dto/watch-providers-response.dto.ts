import { z } from "zod";

export const TMDBWatchProviderSchema = z.object({
  provider_id: z.number(),
  provider_name: z.string(),
  logo_path: z.string().nullable().default(null),
  display_priority: z.number().default(0),
});

const providerGroupSchema = z.array(TMDBWatchProviderSchema).default([]);

export const TMDBWatchProvidersRegionSchema = z.object({
  link: z.string().nullable().default(null),
  flatrate: providerGroupSchema,
  free: providerGroupSchema,
  ads: providerGroupSchema,
  rent: providerGroupSchema,
  buy: providerGroupSchema,
});

export const TMDBWatchProvidersSchema = z.object({
  results: z.record(z.string(), TMDBWatchProvidersRegionSchema).default({}),
});

export type TMDBWatchProvider = z.infer<typeof TMDBWatchProviderSchema>;
export type TMDBWatchProvidersRegion = z.infer<typeof TMDBWatchProvidersRegionSchema>;
export type TMDBWatchProviders = z.infer<typeof TMDBWatchProvidersSchema>;
