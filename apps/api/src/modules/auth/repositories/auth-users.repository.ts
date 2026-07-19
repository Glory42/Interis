import { eq } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";

export type AuthUserInsert = typeof user.$inferInsert;
export type AuthUserRow = typeof user.$inferSelect;

export class AuthUsersRepository {
  static async findByEmail(email: string): Promise<AuthUserRow | null> {
    const [row] = await db.select().from(user).where(eq(user.email, email)).limit(1);
    return row ?? null;
  }

  static async findByUsername(username: string): Promise<AuthUserRow | null> {
    const [row] = await db
      .select()
      .from(user)
      .where(eq(user.username, username))
      .limit(1);

    return row ?? null;
  }

  static async findById(id: string): Promise<AuthUserRow | null> {
    const [row] = await db.select().from(user).where(eq(user.id, id)).limit(1);
    return row ?? null;
  }

  static async insert(row: AuthUserInsert): Promise<AuthUserRow> {
    const [created] = await db.insert(user).values(row).returning();
    if (!created) {
      throw new Error("Failed to create user");
    }

    return created;
  }

  static async updateIdentity(
    id: string,
    data: { username: string; displayUsername: string; name: string },
  ): Promise<AuthUserRow | null> {
    const [updated] = await db
      .update(user)
      .set(data)
      .where(eq(user.id, id))
      .returning();

    return updated ?? null;
  }

  static async updateEmail(id: string, email: string): Promise<AuthUserRow | null> {
    const [updated] = await db.update(user).set({ email }).where(eq(user.id, id)).returning();
    return updated ?? null;
  }
}
