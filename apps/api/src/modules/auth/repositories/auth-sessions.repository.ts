import { and, eq, isNull, ne } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { authSessions } from "../../../infrastructure/database/auth.entity";

export type AuthSessionInsert = typeof authSessions.$inferInsert;
export type AuthSessionRow = typeof authSessions.$inferSelect;

export class AuthSessionsRepository {
  static async insert(row: AuthSessionInsert): Promise<AuthSessionRow> {
    const [created] = await db.insert(authSessions).values(row).returning();
    if (!created) {
      throw new Error("Failed to create session");
    }

    return created;
  }

  static async findById(id: string): Promise<AuthSessionRow | null> {
    const [row] = await db
      .select()
      .from(authSessions)
      .where(eq(authSessions.id, id))
      .limit(1);

    return row ?? null;
  }

  static async findByRefreshTokenHash(hash: string): Promise<AuthSessionRow | null> {
    const [row] = await db
      .select()
      .from(authSessions)
      .where(eq(authSessions.refreshTokenHash, hash))
      .limit(1);

    return row ?? null;
  }

  static async findByPreviousRefreshTokenHash(
    hash: string,
  ): Promise<AuthSessionRow | null> {
    const [row] = await db
      .select()
      .from(authSessions)
      .where(eq(authSessions.previousRefreshTokenHash, hash))
      .limit(1);

    return row ?? null;
  }

  static async rotateRefreshToken(
    id: string,
    previousRefreshTokenHash: string,
    newRefreshTokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    await db
      .update(authSessions)
      .set({
        previousRefreshTokenHash,
        refreshTokenHash: newRefreshTokenHash,
        expiresAt,
      })
      .where(eq(authSessions.id, id));
  }

  static async revoke(id: string): Promise<void> {
    await db
      .update(authSessions)
      .set({ revokedAt: new Date() })
      .where(eq(authSessions.id, id));
  }

  static async revokeAllForUser(userId: string, exceptSessionId?: string): Promise<void> {
    const conditions = [eq(authSessions.userId, userId), isNull(authSessions.revokedAt)];
    if (exceptSessionId) {
      conditions.push(ne(authSessions.id, exceptSessionId));
    }

    await db
      .update(authSessions)
      .set({ revokedAt: new Date() })
      .where(and(...conditions));
  }

  static async listActiveForUser(userId: string): Promise<AuthSessionRow[]> {
    return db
      .select()
      .from(authSessions)
      .where(and(eq(authSessions.userId, userId), isNull(authSessions.revokedAt)));
  }
}
