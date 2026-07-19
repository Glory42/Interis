import { and, eq } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { credentials } from "../../../infrastructure/database/auth.entity";

export type CredentialInsert = typeof credentials.$inferInsert;
export type CredentialRow = typeof credentials.$inferSelect;

export class AuthCredentialsRepository {
  static async insert(row: CredentialInsert): Promise<CredentialRow> {
    const [created] = await db.insert(credentials).values(row).returning();
    if (!created) {
      throw new Error("Failed to create credential");
    }

    return created;
  }

  static async findPasswordCredential(userId: string): Promise<CredentialRow | null> {
    const [row] = await db
      .select()
      .from(credentials)
      .where(and(eq(credentials.userId, userId), eq(credentials.type, "password")))
      .limit(1);

    return row ?? null;
  }

  static async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    await db.update(credentials).set({ passwordHash }).where(eq(credentials.id, id));
  }
}
