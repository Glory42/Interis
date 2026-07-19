import { eq } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { passwordResetTokens } from "../../../infrastructure/database/auth.entity";

export type PasswordResetTokenInsert = typeof passwordResetTokens.$inferInsert;
export type PasswordResetTokenRow = typeof passwordResetTokens.$inferSelect;

export class AuthPasswordResetRepository {
  static async insert(row: PasswordResetTokenInsert): Promise<PasswordResetTokenRow> {
    const [created] = await db.insert(passwordResetTokens).values(row).returning();
    if (!created) {
      throw new Error("Failed to create password reset token");
    }

    return created;
  }

  static async findByTokenHash(tokenHash: string): Promise<PasswordResetTokenRow | null> {
    const [row] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.tokenHash, tokenHash))
      .limit(1);

    return row ?? null;
  }

  static async markUsed(id: string): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, id));
  }
}
