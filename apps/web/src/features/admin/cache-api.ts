import { z } from "zod";
import { apiRequest } from "@/lib/api-client";

const cacheSummarySchema = z.object({
  startedAt: z.coerce.date(),
  memory: z.object({ hits: z.number(), misses: z.number() }),
  titles: z.object({ movies: z.number(), serials: z.number() }),
  unreferenced: z.object({ movies: z.number(), serials: z.number() }),
});

const refreshResultSchema = z.object({ titles: z.array(z.object({ id: z.number(), title: z.string(), ok: z.boolean() })) });
const purgeResultSchema = z.object({ movies: z.number(), serials: z.number() });

export type CacheKind = "movie" | "serial";
export type RefreshResult = z.infer<typeof refreshResultSchema>;
export type PurgeResult = z.infer<typeof purgeResultSchema>;

export const getCacheSummary = async () => cacheSummarySchema.parse(await apiRequest<unknown>("/api/admin/cache"));

export const refreshOldest = async (kind: CacheKind): Promise<RefreshResult> =>
  refreshResultSchema.parse(await apiRequest<unknown, { kind: CacheKind }>("/api/admin/cache/refresh-oldest", { method: "POST", body: { kind } }));

export const purgeUnreferenced = async (adminPassword: string): Promise<PurgeResult> =>
  purgeResultSchema.parse(await apiRequest<unknown, { adminPassword: string }>("/api/admin/cache/purge", { method: "POST", body: { adminPassword } }));
