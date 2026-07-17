import { eq } from "drizzle-orm";
import { db } from "../../../src/infrastructure/database/db";
import { user } from "../../../src/infrastructure/database/auth.entity";
import { profiles } from "../../../src/modules/users/users.entity";

export const promoteToAdmin = async (username: string): Promise<void> => {
  const [row] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.username, username))
    .limit(1);

  if (!row) {
    throw new Error(`Test user ${username} not found`);
  }

  await db.update(profiles).set({ isAdmin: true }).where(eq(profiles.userId, row.id));
};
