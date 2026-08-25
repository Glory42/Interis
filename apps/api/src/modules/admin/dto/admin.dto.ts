import { z } from "zod";
import { paginationQuerySchema } from "../../../commons/validation/common.schemas";

export const ListUsersQuerySchema = z.object({
  query: z.string().trim().optional(),
  ...paginationQuerySchema.shape,
});

export type ListUsersQuery = z.input<typeof ListUsersQuerySchema>;

export const AdminResetPasswordSchema = z.object({
  newPassword: z.string().min(1).max(256),
});

export const AdminSuspendUserSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});
