import { z } from "zod";

export const DEFAULT_WATCH_REGION = "US";

// ISO 3166-1 alpha-2, case-insensitive on the way in, upper-case on the way out.
export const WatchProvidersQuerySchema = z.object({
  region: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{2}$/, "region must be an ISO 3166-1 alpha-2 code")
    .transform((value) => value.toUpperCase())
    .default(DEFAULT_WATCH_REGION),
});

export type WatchProvidersQuery = z.input<typeof WatchProvidersQuerySchema>;
