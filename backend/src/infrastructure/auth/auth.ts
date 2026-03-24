import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../database/db";
import * as schema from "../database/entities";
import { profiles } from "../../modules/users/users.entity";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [process.env.CORS_ORIGIN!],

  databaseHooks: {
    user: {
      create: {
        after: async (newUser) => {
          const baseUsername = (newUser.email.split("@").at(0) ?? newUser.email)
            .replace(/[^a-zA-Z0-9_]/g, "")
            .toLowerCase()
            .slice(0, 20);

          const username = `${baseUsername}_${Math.random().toString(36).slice(2, 7)}`;

          await db.insert(profiles).values({
            userId: newUser.id,
            username,
            isAdmin: false,
            top4MovieIds: [],
          });
        },
      },
    },
  },
});
