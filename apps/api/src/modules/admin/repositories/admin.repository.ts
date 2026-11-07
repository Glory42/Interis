import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import { profiles } from "../../users/users.entity";
import { reports } from "../../reports/reports.entity";
import { reviews } from "../../reviews/reviews.entity";
import { posts } from "../../posts/posts.entity";

// ILIKE treats % and _ as wildcards; a search for "%" should mean the character.
const toContainsPattern = (query: string) => `%${query.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;

const userColumns = {
  id: user.id,
  username: user.username,
  displayUsername: user.displayUsername,
  email: user.email,
  avatarUrl: profiles.avatarUrl,
  isAdmin: profiles.isAdmin,
  // Effective state: a suspension whose end time has passed no longer counts.
  isSuspended: sql<boolean>`(${profiles.isSuspended} AND (${profiles.suspendedUntil} IS NULL OR ${profiles.suspendedUntil} > now()))`,
  createdAt: profiles.createdAt,
};

const suspender = alias(user, "suspender");

export class AdminRepository {
  static async listUsers(query: string | undefined, limit: number, offset: number) {
    const pattern = query ? toContainsPattern(query) : null;
    return db
      .select(userColumns)
      .from(user)
      .innerJoin(profiles, eq(user.id, profiles.userId))
      .where(pattern ? or(ilike(user.username, pattern), ilike(user.email, pattern)) : undefined)
      .orderBy(desc(profiles.createdAt))
      .limit(limit)
      .offset(offset);
  }

  static async findUserDetail(username: string) {
    const [row] = await db
      .select({
        ...userColumns,
        suspendedAt: profiles.suspendedAt,
        suspendedReason: profiles.suspendedReason,
        suspendedUntil: profiles.suspendedUntil,
        suspendedBy: suspender.username,
      })
      .from(user)
      .innerJoin(profiles, eq(user.id, profiles.userId))
      .leftJoin(suspender, eq(suspender.id, profiles.suspendedBy))
      .where(eq(user.username, username))
      .limit(1);
    return row ?? null;
  }

  // Reports this user filed, and reports against their reviews and posts.
  static async countReports(userId: string): Promise<{ reportsFiled: number; reportsAgainst: number }> {
    const [filedRows, againstRows] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)`.mapWith(Number) })
        .from(reports)
        .where(eq(reports.reporterId, userId)),
      db
        .select({ count: sql<number>`count(*)`.mapWith(Number) })
        .from(reports)
        .where(
          or(
            and(
              eq(reports.targetType, "review"),
              inArray(reports.targetId, db.select({ id: sql<string>`${reviews.id}::text` }).from(reviews).where(eq(reviews.userId, userId))),
            ),
            and(
              eq(reports.targetType, "post"),
              inArray(reports.targetId, db.select({ id: sql<string>`${posts.id}::text` }).from(posts).where(eq(posts.userId, userId))),
            ),
          ),
        ),
    ]);
    return { reportsFiled: filedRows[0]?.count ?? 0, reportsAgainst: againstRows[0]?.count ?? 0 };
  }
}
