import { asc, eq, ilike, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import { profiles } from "../users.entity";
import type { UpdateProfileDto } from "../dto/users.dto";
import type { ThemeId } from "../constants/theme.constants";
import { UsersTopPicksRepository } from "./users-top-picks.repository";

const profileSelect = {
  id: user.id,
  name: user.name,
  email: user.email,
  image: user.image,
  username: user.username,
  displayUsername: user.displayUsername,
  bio: profiles.bio,
  location: profiles.location,
  avatarUrl: profiles.avatarUrl,
  favoriteGenres: profiles.favoriteGenres,
  themeId: profiles.themeId,
  isAdmin: profiles.isAdmin,
  createdAt: profiles.createdAt,
} as const;

export class UsersProfileRepository {
  static async findProfileByUsername(username: string) {
    const [result] = await db
      .select(profileSelect)
      .from(profiles)
      .innerJoin(user, eq(profiles.userId, user.id))
      .where(eq(user.username, username))
      .limit(1);

    return result ?? null;
  }

  static async findProfileById(userId: string) {
    const [result] = await db
      .select(profileSelect)
      .from(profiles)
      .innerJoin(user, eq(profiles.userId, user.id))
      .where(eq(profiles.userId, userId))
      .limit(1);

    return result ?? null;
  }

  static async searchProfilesByUsername(query: string, limit: number) {
    const normalizedQuery = query.trim().toLowerCase();
    if (normalizedQuery.length === 0) {
      return [];
    }

    const containsPattern = `%${normalizedQuery}%`;
    const prefixPattern = `${normalizedQuery}%`;

    return db
      .select({
        id: user.id,
        username: user.username,
        displayUsername: user.displayUsername,
        image: user.image,
        avatarUrl: profiles.avatarUrl,
      })
      .from(user)
      .leftJoin(profiles, eq(user.id, profiles.userId))
      .where(ilike(user.username, containsPattern))
      .orderBy(
        sql<number>`case
          when lower(${user.username}) = ${normalizedQuery} then 0
          when lower(${user.username}) like ${prefixPattern} then 1
          else 2
        end`,
        asc(user.username),
      )
      .limit(limit);
  }

  static async updateProfile(userId: string, input: UpdateProfileDto) {
    const normalizedTopPicks =
      input.topPicks !== undefined
        ? UsersTopPicksRepository.normalizeTopPickCategories(input.topPicks)
        : null;

    if (normalizedTopPicks !== null) {
      await UsersTopPicksRepository.replaceTopPicksForCategories(userId, normalizedTopPicks);
    }

    const profileUpdatePayload: {
      bio?: string;
      location?: string;
      avatarUrl?: string;
      favoriteGenres?: string[];
    } = {
      ...(input.bio !== undefined && { bio: input.bio }),
      ...(input.location !== undefined && { location: input.location }),
      ...(input.avatarUrl !== undefined && { avatarUrl: input.avatarUrl }),
      ...(input.favoriteGenres !== undefined && {
        favoriteGenres: input.favoriteGenres,
      }),
    };

    const hasProfilePatch = Object.keys(profileUpdatePayload).length > 0;

    if (hasProfilePatch) {
      const [updated] = await db
        .update(profiles)
        .set(profileUpdatePayload)
        .where(eq(profiles.userId, userId))
        .returning();

      return updated ?? null;
    }

    const [existing] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    return existing ?? null;
  }

  static async updateTheme(userId: string, themeId: ThemeId) {
    const [updated] = await db
      .update(profiles)
      .set({ themeId })
      .where(eq(profiles.userId, userId))
      .returning({ themeId: profiles.themeId });

    return updated ?? null;
  }
}
