import { eq } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { securityAnswers, user } from "../../../infrastructure/database/auth.entity";

export type SecurityAnswerRow = typeof securityAnswers.$inferSelect;

export class SecurityAnswersRepository {
  static async upsert(
    userId: string,
    question: string,
    answerHash: string,
  ): Promise<void> {
    await db
      .insert(securityAnswers)
      .values({ userId, question, answerHash })
      .onConflictDoUpdate({
        target: securityAnswers.userId,
        set: { question, answerHash },
      });
  }

  static async findByUserId(userId: string): Promise<SecurityAnswerRow | null> {
    const [row] = await db
      .select()
      .from(securityAnswers)
      .where(eq(securityAnswers.userId, userId))
      .limit(1);

    return row ?? null;
  }

  static async findByEmail(
    email: string,
  ): Promise<(SecurityAnswerRow & { userEmail: string }) | null> {
    const [row] = await db
      .select({
        userId: securityAnswers.userId,
        question: securityAnswers.question,
        answerHash: securityAnswers.answerHash,
        createdAt: securityAnswers.createdAt,
        updatedAt: securityAnswers.updatedAt,
        userEmail: user.email,
      })
      .from(securityAnswers)
      .innerJoin(user, eq(securityAnswers.userId, user.id))
      .where(eq(user.email, email))
      .limit(1);

    return row ?? null;
  }
}
