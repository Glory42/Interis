import { eq } from "drizzle-orm";
import { db } from "../../infrastructure/database/db";
import { profiles } from "./users.entity";
import { user } from "../../infrastructure/database/auth.entity";
import { diaryEntries } from "../diary/diary.entity";
import { reviews } from "../reviews/reviews.entity";

export type UpdateProfileInput = {
  bio?: string;
  location?: string;
  avatarUrl?: string;
  backdropUrl?: string;
  top4MovieIds?: number[];
};

export class UsersService {
  static async findByUsername(username: string) {
    const [result] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        username: profiles.username,
        bio: profiles.bio,
        location: profiles.location,
        avatarUrl: profiles.avatarUrl,
        backdropUrl: profiles.backdropUrl,
        top4MovieIds: profiles.top4MovieIds,
        isAdmin: profiles.isAdmin,
      })
      .from(profiles)
      .innerJoin(user, eq(profiles.userId, user.id))
      .where(eq(profiles.username, username))
      .limit(1);

    return result ?? null;
  }

  static async findById(userId: string) {
    const [result] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        username: profiles.username,
        bio: profiles.bio,
        location: profiles.location,
        avatarUrl: profiles.avatarUrl,
        backdropUrl: profiles.backdropUrl,
        top4MovieIds: profiles.top4MovieIds,
        isAdmin: profiles.isAdmin,
        createdAt: profiles.createdAt,
      })
      .from(profiles)
      .innerJoin(user, eq(profiles.userId, user.id))
      .where(eq(profiles.userId, userId))
      .limit(1);

    return result ?? null;
  }

  static async updateProfile(userId: string, input: UpdateProfileInput) {
    const [updated] = await db
      .update(profiles)
      .set({
        ...(input.bio !== undefined && { bio: input.bio }),
        ...(input.location !== undefined && { location: input.location }),
        ...(input.avatarUrl !== undefined && { avatarUrl: input.avatarUrl }),
        ...(input.backdropUrl !== undefined && {
          backdropUrl: input.backdropUrl,
        }),
        ...(input.top4MovieIds !== undefined && {
          top4MovieIds: input.top4MovieIds,
        }),
      })
      .where(eq(profiles.userId, userId))
      .returning();

    return updated ?? null;
  }

  static async isUsernameTaken(username: string, excludeUserId?: string) {
    const [existing] = await db
      .select({ userId: profiles.userId })
      .from(profiles)
      .where(eq(profiles.username, username))
      .limit(1);

    if (!existing) return false;
    if (excludeUserId && existing.userId === excludeUserId) return false;
    return true;
  }

  static async updateUsername(userId: string, username: string) {
    const isTaken = await UsersService.isUsernameTaken(username, userId);
    if (isTaken) return { error: "Username is already taken" } as const;

    const [updated] = await db
      .update(profiles)
      .set({ username })
      .where(eq(profiles.userId, userId))
      .returning({ username: profiles.username });

    return { username: updated?.username } as const;
  }

  static async getStats(userId: string) {
    const allEntries = await db
      .select({ id: diaryEntries.id })
      .from(diaryEntries)
      .where(eq(diaryEntries.userId, userId));

    const reviewCount = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(eq(reviews.userId, userId));

    return {
      entryCount: allEntries.length,
      reviewCount: reviewCount.length,
    };
  }
}
