import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username } from "better-auth/plugins";
import { db } from "../database/db";
import * as schema from "../database/entities";
import { profiles } from "../../modules/users/users.entity";
import {
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  isUsernameValid,
  normalizeUsername,
} from "../../modules/users/policies/username.policy";

const isProduction = process.env.NODE_ENV === "production";

const getStringField = (
  data: Record<string, unknown>,
  field: string,
): string | null => {
  const value = data[field];
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),

  emailAndPassword: {
    enabled: true,
  },

  user: {
    changeEmail: {
      enabled: true,
      updateEmailWithoutVerification: true,
    },
  },

  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [process.env.CORS_ORIGIN!],

  plugins: [
    username({
      minUsernameLength: USERNAME_MIN_LENGTH,
      maxUsernameLength: USERNAME_MAX_LENGTH,
      usernameNormalization: normalizeUsername,
      displayUsernameNormalization: normalizeUsername,
      usernameValidator: (rawUsername) =>
        isUsernameValid(normalizeUsername(rawUsername)),
    }),
  ],

  advanced: {
    crossSubDomainCookies: {
      enabled: false,
    },
    defaultCookieAttributes: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    },
  },

  databaseHooks: {
    user: {
      create: {
        // Identity policy: keep name synced with username at signup.
        before: async (newUser) => {
          const payload = newUser as Record<string, unknown>;
          const rawUsername = getStringField(payload, "username");
          const normalizedUsername = rawUsername
            ? normalizeUsername(rawUsername)
            : null;

          const fallbackName =
            getStringField(payload, "name") ??
            getStringField(payload, "email")?.split("@")[0] ??
            "user";

          const syncedName = normalizedUsername ?? fallbackName;

          return {
            data: {
              ...newUser,
              name: syncedName,
              ...(normalizedUsername
                ? {
                    username: normalizedUsername,
                    displayUsername: normalizedUsername,
                  }
                : {}),
            },
          };
        },
        // Create the profile row after user is inserted
        after: async (createdUser) => {
          await db.insert(profiles).values({
            userId: createdUser.id,
            isAdmin: false,
            top4MovieIds: [],
          });
        },
      },
      update: {
        // Identity policy: keep name synced with username on username updates.
        before: async (updatedUser) => {
          const payload = updatedUser as Record<string, unknown>;
          const rawUsername = getStringField(payload, "username");
          const normalizedUsername = rawUsername
            ? normalizeUsername(rawUsername)
            : null;

          if (!normalizedUsername) {
            return { data: updatedUser };
          }

          return {
            data: {
              ...updatedUser,
              username: normalizedUsername,
              displayUsername: normalizedUsername,
              name: normalizedUsername,
            },
          };
        },
      },
    },
  },
});
