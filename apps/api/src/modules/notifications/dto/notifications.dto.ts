import { z } from "zod";

export const ListNotificationsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(50).optional(),
  cursor: z.string().optional(),
});

export type ListNotificationsQuery = z.input<typeof ListNotificationsQuerySchema>;

export const NotificationParamsSchema = z.object({
  id: z.uuid(),
});

export type NotificationParams = z.input<typeof NotificationParamsSchema>;
