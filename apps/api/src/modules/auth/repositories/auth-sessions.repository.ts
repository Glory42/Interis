import { and, desc, eq, gt, isNull, lt, ne, or, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { authSessions, user } from "../../../infrastructure/database/auth.entity";
import { profiles } from "../../users/users.entity";

export type AuthSessionInsert = typeof authSessions.$inferInsert;
export type AuthSessionRow = typeof authSessions.$inferSelect;

const isLive = () => and(isNull(authSessions.revokedAt), gt(authSessions.expiresAt, new Date()));

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

  // Session + user + profile flags in one round trip - this runs on every
  // authenticated request, so three sequential lookups added up fast.
  static async findSessionContext(id: string) {
    const [row] = await db
      .select({
        sessionUserId: authSessions.userId,
        expiresAt: authSessions.expiresAt,
        revokedAt: authSessions.revokedAt,
        user,
        isAdmin: profiles.isAdmin,
        isSuspended: profiles.isSuspended,
        suspendedUntil: profiles.suspendedUntil,
      })
      .from(authSessions)
      .innerJoin(user, eq(user.id, authSessions.userId))
      .leftJoin(profiles, eq(profiles.userId, authSessions.userId))
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

  static async revokeAllForUser(userId: string, exceptSessionId?: string): Promise<number> {
    const conditions = [eq(authSessions.userId, userId), isNull(authSessions.revokedAt)];
    if (exceptSessionId) {
      conditions.push(ne(authSessions.id, exceptSessionId));
    }

    const revoked = await db
      .update(authSessions)
      .set({ revokedAt: new Date() })
      .where(and(...conditions))
      .returning({ id: authSessions.id });
    return revoked.length;
  }

  // Scoped to the owner, so another user's session id matches nothing.
  static async revokeLiveForUser(id: string, userId: string): Promise<boolean> {
    const revoked = await db
      .update(authSessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(authSessions.id, id), eq(authSessions.userId, userId), isLive()))
      .returning({ id: authSessions.id });
    return revoked.length > 0;
  }

  // Current session first, then most recently active; no token hashes selected.
  static async listLiveForUser(userId: string, currentSessionId: string, limit: number) {
    return db
      .select({
        id: authSessions.id,
        userAgent: authSessions.userAgent,
        ipAddress: authSessions.ipAddress,
        createdAt: authSessions.createdAt,
        updatedAt: authSessions.updatedAt,
      })
      .from(authSessions)
      .where(and(eq(authSessions.userId, userId), isLive()))
      .orderBy(
        desc(sql`${authSessions.id} = ${currentSessionId}`),
        desc(authSessions.updatedAt),
        desc(authSessions.id),
      )
      .limit(limit);
  }

  static async deleteExpiredOrRevokedBefore(cutoff: Date): Promise<void> {
    await db
      .delete(authSessions)
      .where(or(lt(authSessions.expiresAt, cutoff), lt(authSessions.revokedAt, cutoff)));
  }

  static async listActiveForUser(userId: string): Promise<AuthSessionRow[]> {
    return db
      .select()
      .from(authSessions)
      .where(and(eq(authSessions.userId, userId), isNull(authSessions.revokedAt)));
  }
}
