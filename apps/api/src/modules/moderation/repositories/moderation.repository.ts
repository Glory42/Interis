import { and, eq, or } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import { profiles } from "../../users/users.entity";
import { userBlocks, userMutes } from "../moderation.entity";

export class ModerationRepository {
  static async blockUser(blockerId: string, blockedId: string) {
    await db.insert(userBlocks).values({ blockerId, blockedId }).onConflictDoNothing();
  }

  static async unblockUser(blockerId: string, blockedId: string) {
    await db
      .delete(userBlocks)
      .where(and(eq(userBlocks.blockerId, blockerId), eq(userBlocks.blockedId, blockedId)));
  }

  static async isBlocked(userAId: string, userBId: string): Promise<boolean> {
    const [row] = await db
      .select({ blockerId: userBlocks.blockerId })
      .from(userBlocks)
      .where(
        or(
          and(eq(userBlocks.blockerId, userAId), eq(userBlocks.blockedId, userBId)),
          and(eq(userBlocks.blockerId, userBId), eq(userBlocks.blockedId, userAId)),
        ),
      )
      .limit(1);

    return row !== undefined;
  }

  static async getBlockedIds(blockerId: string): Promise<string[]> {
    const rows = await db
      .select({ blockedId: userBlocks.blockedId })
      .from(userBlocks)
      .where(eq(userBlocks.blockerId, blockerId));

    return rows.map((row) => row.blockedId);
  }

  static async getBlockedByIds(blockedId: string): Promise<string[]> {
    const rows = await db
      .select({ blockerId: userBlocks.blockerId })
      .from(userBlocks)
      .where(eq(userBlocks.blockedId, blockedId));

    return rows.map((row) => row.blockerId);
  }

  static async listBlocked(blockerId: string) {
    return db
      .select({
        id: user.id,
        username: user.username,
        displayUsername: user.displayUsername,
        avatarUrl: profiles.avatarUrl,
        createdAt: userBlocks.createdAt,
      })
      .from(userBlocks)
      .innerJoin(user, eq(userBlocks.blockedId, user.id))
      .leftJoin(profiles, eq(user.id, profiles.userId))
      .where(eq(userBlocks.blockerId, blockerId));
  }

  static async muteUser(muterId: string, mutedId: string) {
    await db.insert(userMutes).values({ muterId, mutedId }).onConflictDoNothing();
  }

  static async unmuteUser(muterId: string, mutedId: string) {
    await db
      .delete(userMutes)
      .where(and(eq(userMutes.muterId, muterId), eq(userMutes.mutedId, mutedId)));
  }

  static async isMuted(muterId: string, mutedId: string): Promise<boolean> {
    const [row] = await db
      .select({ muterId: userMutes.muterId })
      .from(userMutes)
      .where(and(eq(userMutes.muterId, muterId), eq(userMutes.mutedId, mutedId)))
      .limit(1);

    return row !== undefined;
  }

  static async getMutedIds(muterId: string): Promise<string[]> {
    const rows = await db
      .select({ mutedId: userMutes.mutedId })
      .from(userMutes)
      .where(eq(userMutes.muterId, muterId));

    return rows.map((row) => row.mutedId);
  }

  static async listMuted(muterId: string) {
    return db
      .select({
        id: user.id,
        username: user.username,
        displayUsername: user.displayUsername,
        avatarUrl: profiles.avatarUrl,
        createdAt: userMutes.createdAt,
      })
      .from(userMutes)
      .innerJoin(user, eq(userMutes.mutedId, user.id))
      .leftJoin(profiles, eq(user.id, profiles.userId))
      .where(eq(userMutes.muterId, muterId));
  }
}
