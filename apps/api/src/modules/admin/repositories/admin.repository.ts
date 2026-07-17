import { desc, eq, ilike } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import { profiles } from "../../users/users.entity";

export class AdminRepository {
  static async listUsers(query: string | undefined, limit: number, offset: number) {
    return db
      .select({
        id: user.id,
        username: user.username,
        displayUsername: user.displayUsername,
        email: user.email,
        avatarUrl: profiles.avatarUrl,
        isAdmin: profiles.isAdmin,
        createdAt: profiles.createdAt,
      })
      .from(user)
      .innerJoin(profiles, eq(user.id, profiles.userId))
      .where(query ? ilike(user.username, `%${query}%`) : undefined)
      .orderBy(desc(profiles.createdAt))
      .limit(limit)
      .offset(offset);
  }
}
