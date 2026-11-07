import { z } from "zod";
import { paginationQuerySchema } from "../../../commons/validation/common.schemas";

export const ListUsersQuerySchema = z.object({
  query: z.string().trim().optional(),
  ...paginationQuerySchema.shape,
});

export type ListUsersQuery = z.input<typeof ListUsersQuerySchema>;

// Optional so a missing password is a 401 from the password check, not a 400.
const adminPasswordSchema = z.string().max(256).optional();

export const AdminResetPasswordSchema = z.object({
  newPassword: z.string().min(1).max(256),
  adminPassword: adminPasswordSchema,
});

export const AdminSuspendUserSchema = z.object({
  reason: z.string().trim().max(500).optional(),
  // Omitted = until an admin lifts it.
  durationDays: z.number().int().min(1).max(365).optional(),
  adminPassword: adminPasswordSchema,
});

export const AdminPasswordConfirmSchema = z.object({
  adminPassword: adminPasswordSchema,
});

export const AdminAuditQuerySchema = z.object({
  actor: z.string().trim().min(1).max(64).optional(),
  cursor: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
