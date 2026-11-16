import { z } from "zod";
import { apiRequest } from "@/lib/api-client";

export const accountSessionSchema = z.object({
  id: z.string(),
  deviceLabel: z.string(),
  ipAddressMasked: z.string().nullable(),
  createdAt: z.string(),
  lastActiveAt: z.string(),
  isCurrent: z.boolean(),
});

const accountSessionsSchema = z.object({
  sessions: z.array(accountSessionSchema),
  hasMore: z.boolean(),
});

export type AccountSession = z.infer<typeof accountSessionSchema>;
export type AccountSessions = z.infer<typeof accountSessionsSchema>;

export const getAccountSessions = async (): Promise<AccountSessions> =>
  accountSessionsSchema.parse(await apiRequest<unknown>("/api/auth/sessions"));

export const revokeAccountSession = async (sessionId: string): Promise<void> => {
  await apiRequest<unknown>(`/api/auth/sessions/${encodeURIComponent(sessionId)}`, { method: "DELETE" });
};

// Needs the current password (#136); the caller's own session stays signed in.
export const revokeOtherAccountSessions = async (currentPassword: string): Promise<{ revokedCount: number }> => {
  const response = await apiRequest<unknown, { currentPassword: string }>("/api/auth/sessions/revoke-others", {
    method: "POST",
    body: { currentPassword },
  });
  return z.object({ revokedCount: z.number() }).parse(response);
};
