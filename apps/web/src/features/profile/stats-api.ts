import { z } from "zod";
import { apiRequest } from "@/lib/api-client";

const detailedStatsSchema = z.object({
  entriesPerMonth: z.array(z.object({ month: z.string(), count: z.number() })),
  ratingDistribution: z.array(z.object({ rating: z.number(), count: z.number() })),
  topGenres: z.array(z.object({ genre: z.string(), count: z.number() })),
  topDirectors: z.array(
    z.object({ director: z.string(), count: z.number(), slug: z.string().nullable() }),
  ),
});

export type DetailedStats = z.infer<typeof detailedStatsSchema>;

export const getDetailedStats = async (
  username: string,
  options: { signal?: AbortSignal } = {},
): Promise<DetailedStats> => {
  const response = await apiRequest<unknown>(
    `/api/users/${encodeURIComponent(username)}/stats/detailed`,
    { method: "GET", signal: options.signal },
  );

  return detailedStatsSchema.parse(response);
};
