import { and, desc, eq, lt, or, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import { profiles } from "../../users/users.entity";
import { notifications, type notificationTypeEnum } from "../notifications.entity";
import type { FeedCursor } from "../../social/helpers/social-feed-cursor.helper";

export type NotificationType = (typeof notificationTypeEnum.enumValues)[number];

export class NotificationsRepository {
  static async insert(input: {
    recipientId: string;
    actorId: string;
    type: NotificationType;
    entityId: string;
    metadata?: string;
  }) {
    await db.insert(notifications).values(input);
  }

  static async listForUser(recipientId: string, limit: number, before?: FeedCursor) {
    const cursorCondition = before
      ? or(
          lt(notifications.createdAt, before.createdAt),
          and(eq(notifications.createdAt, before.createdAt), lt(notifications.id, before.id)),
        )
      : undefined;

    return db
      .select({
        id: notifications.id,
        actorId: notifications.actorId,
        actorUsername: user.username,
        actorDisplayUsername: user.displayUsername,
        actorImage: user.image,
        actorAvatarUrl: profiles.avatarUrl,
        type: notifications.type,
        entityId: notifications.entityId,
        metadata: notifications.metadata,
        isRead: notifications.isRead,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .innerJoin(user, eq(notifications.actorId, user.id))
      .leftJoin(profiles, eq(user.id, profiles.userId))
      .where(
        cursorCondition
          ? and(eq(notifications.recipientId, recipientId), cursorCondition)
          : eq(notifications.recipientId, recipientId),
      )
      .orderBy(desc(notifications.createdAt), desc(notifications.id))
      .limit(limit);
  }

  static async countUnread(recipientId: string): Promise<number> {
    const [row] = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(notifications)
      .where(and(eq(notifications.recipientId, recipientId), eq(notifications.isRead, false)));

    return row?.count ?? 0;
  }

  static async markRead(recipientId: string, notificationId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(eq(notifications.id, notificationId), eq(notifications.recipientId, recipientId)),
      );
  }

  static async markAllRead(recipientId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.recipientId, recipientId), eq(notifications.isRead, false)));
  }
}
