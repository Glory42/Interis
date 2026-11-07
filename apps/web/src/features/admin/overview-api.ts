import { z } from "zod";
import { apiRequest } from "@/lib/api-client";

const adminOverviewSchema = z.object({
  computedAt: z.coerce.date(),
  needsYou: z.object({
    pendingReports: z.number(),
    oldestPendingAt: z.coerce.date().nullable(),
    reportedItems: z.number(),
    suspensionsEndingSoon: z.number(),
  }),
  lastSevenDays: z.object({
    newAccounts: z.number(),
    diaryEntries: z.number(),
    reviews: z.number(),
    posts: z.number(),
    comments: z.number(),
  }),
  cache: z.object({ films: z.number(), series: z.number() }),
  latestActions: z.array(
    z.object({
      action: z.string(),
      targetLabel: z.string().nullable(),
      actorUsername: z.string(),
      createdAt: z.coerce.date(),
    }),
  ),
});

export type AdminOverview = z.infer<typeof adminOverviewSchema>;

export const getAdminOverview = async (): Promise<AdminOverview> =>
  adminOverviewSchema.parse(await apiRequest<unknown>("/api/admin/overview"));
