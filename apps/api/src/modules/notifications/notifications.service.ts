import {
  decodeFeedCursor,
  encodeFeedCursor,
} from "../social/helpers/social-feed-cursor.helper";
import {
  NotificationsRepository,
  type NotificationType,
} from "./repositories/notifications.repository";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

const normalizeLimit = (limit?: number): number => {
  if (!limit || Number.isNaN(limit)) {
    return DEFAULT_PAGE_SIZE;
  }
  return Math.max(1, Math.min(limit, MAX_PAGE_SIZE));
};

export type NotificationPage = Awaited<ReturnType<typeof NotificationsService.listForUser>>;

export class NotificationsService {
  static async notify(input: {
    recipientId: string;
    actorId: string;
    type: NotificationType;
    entityId: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    if (input.recipientId === input.actorId) {
      return;
    }

    await NotificationsRepository.insert({
      recipientId: input.recipientId,
      actorId: input.actorId,
      type: input.type,
      entityId: input.entityId,
      metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
    });
  }

  static async listForUser(userId: string, limit?: number, cursor?: string) {
    const normalizedLimit = normalizeLimit(limit);
    const decodedCursor = decodeFeedCursor(cursor);

    const rows = await NotificationsRepository.listForUser(
      userId,
      normalizedLimit,
      decodedCursor,
    );

    const lastRow = rows.at(-1);
    const nextCursor =
      rows.length === normalizedLimit && lastRow
        ? encodeFeedCursor({ createdAt: lastRow.createdAt, id: lastRow.id })
        : null;

    return { items: rows, nextCursor };
  }

  static async getUnreadCount(userId: string): Promise<number> {
    return NotificationsRepository.countUnread(userId);
  }

  static async markAsRead(userId: string, notificationId: string): Promise<void> {
    await NotificationsRepository.markRead(userId, notificationId);
  }

  static async markAllAsRead(userId: string): Promise<void> {
    await NotificationsRepository.markAllRead(userId);
  }
}
