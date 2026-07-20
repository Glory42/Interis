import { z } from "zod";

export const ListUsersQuerySchema = z.object({
  query: z.string().trim().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
});

export type ListUsersQuery = z.input<typeof ListUsersQuerySchema>;

export const AdminResetPasswordSchema = z.object({
  newPassword: z.string().min(1).max(256),
});

export const AdminSuspendUserSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});
