import { eq } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { pushPreferences } from "../push.entity";
import type { PushPreferences } from "../constants/push.constants";

const preferenceColumns = {
  follows: pushPreferences.follows,
  likes: pushPreferences.likes,
  comments: pushPreferences.comments,
  moderation: pushPreferences.moderation,
};

export class PushPreferencesRepository {
  static async find(userId: string): Promise<PushPreferences | null> {
    const [row] = await db
      .select(preferenceColumns)
      .from(pushPreferences)
      .where(eq(pushPreferences.userId, userId))
      .limit(1);
    return row ?? null;
  }

  static async upsert(userId: string, changes: Partial<PushPreferences>): Promise<PushPreferences> {
    const [row] = await db
      .insert(pushPreferences)
      .values({ userId, ...changes })
      .onConflictDoUpdate({
        target: pushPreferences.userId,
        set: { ...changes, updatedAt: new Date() },
      })
      .returning(preferenceColumns);
    if (!row) throw new Error("Push preference upsert returned no row");
    return row;
  }
}
