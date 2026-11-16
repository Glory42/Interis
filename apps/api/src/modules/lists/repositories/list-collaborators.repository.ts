import { and, asc, count, eq, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import { profiles } from "../../users/users.entity";
import { listCollaborators } from "../lists.entity";
import type { CollaboratorStatus } from "../helpers/list-access.policy";

export class ListCollaboratorsRepository {
  static async findStatus(listId: string, userId: string): Promise<CollaboratorStatus | null> {
    const [row] = await db
      .select({ status: listCollaborators.status })
      .from(listCollaborators)
      .where(and(eq(listCollaborators.listId, listId), eq(listCollaborators.userId, userId)))
      .limit(1);

    return row?.status ?? null;
  }

  // Bounded by MAX_LIST_COLLABORATORS, so no paging.
  static async listForList(listId: string) {
    return db
      .select({
        userId: listCollaborators.userId,
        username: user.username,
        displayUsername: user.displayUsername,
        avatarUrl: profiles.avatarUrl,
        status: listCollaborators.status,
        createdAt: listCollaborators.createdAt,
      })
      .from(listCollaborators)
      .innerJoin(user, eq(user.id, listCollaborators.userId))
      .leftJoin(profiles, eq(profiles.userId, listCollaborators.userId))
      .where(eq(listCollaborators.listId, listId))
      .orderBy(asc(listCollaborators.createdAt));
  }

  static async countForList(listId: string): Promise<number> {
    const [row] = await db
      .select({ n: count() })
      .from(listCollaborators)
      .where(eq(listCollaborators.listId, listId));
    return Number(row?.n ?? 0);
  }

  // One statement so concurrent invites can't pass the cap; false when full or already invited.
  static async insertInvite(
    input: { listId: string; userId: string; invitedByUserId: string },
    max: number,
  ): Promise<boolean> {
    const result = await db.execute<{ id: string }>(sql`
      INSERT INTO ${listCollaborators} (id, list_id, user_id, invited_by_user_id, status)
      SELECT ${crypto.randomUUID()}::uuid, ${input.listId}::uuid, ${input.userId}, ${input.invitedByUserId}, 'invited'
      WHERE (SELECT count(*) FROM ${listCollaborators} WHERE list_id = ${input.listId}::uuid) < ${max}
      ON CONFLICT DO NOTHING
      RETURNING id
    `);
    return result.rows.length > 0;
  }

  static async accept(listId: string, userId: string): Promise<boolean> {
    const rows = await db
      .update(listCollaborators)
      .set({ status: "accepted" })
      .where(
        and(
          eq(listCollaborators.listId, listId),
          eq(listCollaborators.userId, userId),
          eq(listCollaborators.status, "invited"),
        ),
      )
      .returning({ id: listCollaborators.id });
    return rows.length > 0;
  }

  static async remove(listId: string, userId: string) {
    const [row] = await db
      .delete(listCollaborators)
      .where(and(eq(listCollaborators.listId, listId), eq(listCollaborators.userId, userId)))
      .returning({ status: listCollaborators.status });
    return row ?? null;
  }
}
