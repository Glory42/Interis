import { z } from "zod";
import { apiRequest } from "@/lib/api-client";

const adminUserDetailSchema = z.object({
  user: z.object({
    id: z.string(),
    username: z.string(),
    email: z.string(),
    isAdmin: z.boolean(),
    isSuspended: z.boolean(),
    createdAt: z.coerce.date(),
    suspendedAt: z.coerce.date().nullable(),
    suspendedReason: z.string().nullable(),
    suspendedUntil: z.coerce.date().nullable(),
    suspendedBy: z.string().nullable(),
    mustChangePassword: z.boolean(),
    hasRecoveryQuestion: z.boolean(),
  }),
  counts: z.object({
    movieEntryCount: z.number(),
    serialEntryCount: z.number().optional(),
    reviewCount: z.number(),
    listCount: z.number().optional(),
    followerCount: z.number().optional(),
    followingCount: z.number().optional(),
    reportsAgainst: z.number(),
    reportsFiled: z.number(),
  }),
  sessions: z.array(
    z.object({ id: z.string(), userAgent: z.string().nullable(), ipAddress: z.string().nullable(), lastActiveAt: z.coerce.date() }),
  ),
});

export type AdminUserDetail = z.infer<typeof adminUserDetailSchema>;

const userPath = (username: string, action = "") => `/api/admin/users/${encodeURIComponent(username)}${action}`;

export const getAdminUserDetail = async (username: string): Promise<AdminUserDetail> =>
  adminUserDetailSchema.parse(await apiRequest<unknown>(userPath(username)));

export type SuspendInput = { username: string; adminPassword: string; reason?: string; durationDays?: number };

export const suspendUserFor = async ({ username, ...body }: SuspendInput): Promise<void> => {
  await apiRequest<unknown, Omit<SuspendInput, "username">>(userPath(username, "/suspend"), { method: "POST", body });
};

const passwordAction = (action: string) => async ({ username, adminPassword }: { username: string; adminPassword: string }) => {
  await apiRequest<unknown, { adminPassword: string }>(userPath(username, action), { method: "POST", body: { adminPassword } });
};

export const revokeUserSessions = passwordAction("/revoke-sessions");
export const forcePasswordReset = passwordAction("/force-password-reset");
export const promoteToAdmin = passwordAction("/promote");
export const demoteFromAdmin = passwordAction("/demote");
