import { eq } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { profiles } from "../../users/users.entity";
import { DEFAULT_THEME_ID } from "../../users/constants/theme.constants";

// Reproduces Better Auth's old databaseHooks.user.create.after side effect —
// every user needs a profile row or the profile page 404s.
export class AuthProfileRepository {
  static async createDefaultProfile(userId: string): Promise<void> {
    await db.insert(profiles).values({
      userId,
      themeId: DEFAULT_THEME_ID,
      isAdmin: false,
    });
  }

  static async requiresPasswordReset(userId: string): Promise<boolean> {
    const [row] = await db
      .select({ mustChangePassword: profiles.mustChangePassword })
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);
    return row?.mustChangePassword ?? false;
  }

  static async setMustChangePassword(userId: string, mustChangePassword: boolean): Promise<void> {
    await db.update(profiles).set({ mustChangePassword }).where(eq(profiles.userId, userId));
  }
}
