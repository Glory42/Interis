import { and, desc, eq, inArray, notInArray, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import { pushPreferences, pushSubscriptions } from "../push.entity";

export type PushDeliveryTarget = Awaited<
  ReturnType<typeof PushSubscriptionsRepository.listDeliveryTargets>
>[number];

export class PushSubscriptionsRepository {
  // The endpoint identifies the browser, so a new sign-in there takes it over.
  static async upsert(input: {
    userId: string;
    endpoint: string;
    p256dh: string;
    auth: string;
    userAgent: string | null;
  }): Promise<void> {
    await db
      .insert(pushSubscriptions)
      .values(input)
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: {
          userId: input.userId,
          p256dh: input.p256dh,
          auth: input.auth,
          userAgent: input.userAgent,
          failureCount: 0,
          lastUsedAt: sql`now()`,
        },
      });
  }

  // Keeps the user's most recently used subscriptions, dropping the rest.
  static async pruneBeyond(userId: string, keep: number): Promise<void> {
    const newest = db
      .select({ id: pushSubscriptions.id })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId))
      .orderBy(desc(pushSubscriptions.lastUsedAt), desc(pushSubscriptions.createdAt))
      .limit(keep);

    await db
      .delete(pushSubscriptions)
      .where(and(eq(pushSubscriptions.userId, userId), notInArray(pushSubscriptions.id, newest)));
  }

  static async deleteForUser(userId: string, endpoint: string): Promise<void> {
    await db
      .delete(pushSubscriptions)
      .where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint)));
  }

  // Subscriptions and push preferences in one round trip; preference columns are null with no row.
  static async listDeliveryTargets(userId: string) {
    return db
      .select({
        id: pushSubscriptions.id,
        endpoint: pushSubscriptions.endpoint,
        p256dh: pushSubscriptions.p256dh,
        auth: pushSubscriptions.auth,
        failureCount: pushSubscriptions.failureCount,
        lastUsedAt: pushSubscriptions.lastUsedAt,
        follows: pushPreferences.follows,
        likes: pushPreferences.likes,
        comments: pushPreferences.comments,
        moderation: pushPreferences.moderation,
      })
      .from(pushSubscriptions)
      .leftJoin(pushPreferences, eq(pushPreferences.userId, pushSubscriptions.userId))
      .where(eq(pushSubscriptions.userId, userId));
  }

  static async findUsernames(userIds: string[]) {
    return db
      .select({ id: user.id, username: user.username })
      .from(user)
      .where(inArray(user.id, userIds));
  }

  static async deleteByIds(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await db.delete(pushSubscriptions).where(inArray(pushSubscriptions.id, ids));
  }

  static async incrementFailures(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await db
      .update(pushSubscriptions)
      .set({ failureCount: sql`${pushSubscriptions.failureCount} + 1` })
      .where(inArray(pushSubscriptions.id, ids));
  }

  static async markDelivered(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await db
      .update(pushSubscriptions)
      .set({ failureCount: 0, lastUsedAt: sql`now()` })
      .where(inArray(pushSubscriptions.id, ids));
  }
}
