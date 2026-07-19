import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, index, pgEnum, uniqueIndex } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  // username plugin fields
  username: text("username").notNull().unique(),
  displayUsername: text("display_username"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  authSessions: many(authSessions),
  passwordResetTokens: many(passwordResetTokens),
  credentials: many(credentials),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

// --- In-house auth module tables (issue #29) ---
// `session` / `account` / `verification` above remain Better Auth's tables,
// live until the dedicated follow-up migration drops them post-cutover.

export const authSessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    refreshTokenHash: text("refresh_token_hash").notNull().unique(),
    // Retained one rotation back so a replayed (already-rotated) refresh
    // token can be recognized as theft and trigger revocation, instead of
    // just failing as "unknown token".
    previousRefreshTokenHash: text("previous_refresh_token_hash"),
    userAgent: text("user_agent"),
    ipAddress: text("ip_address"),
    expiresAt: timestamp("expires_at").notNull(),
    revokedAt: timestamp("revoked_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("sessions_userId_idx").on(table.userId),
    uniqueIndex("sessions_refreshTokenHash_idx").on(table.refreshTokenHash),
    index("sessions_previousRefreshTokenHash_idx").on(table.previousRefreshTokenHash),
  ],
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("password_reset_tokens_userId_idx").on(table.userId),
    uniqueIndex("password_reset_tokens_tokenHash_idx").on(table.tokenHash),
  ],
);

export const credentialTypeEnum = pgEnum("credential_type", ["password", "oauth"]);

export const credentials = pgTable(
  "credentials",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: credentialTypeEnum("type").notNull(),
    passwordHash: text("password_hash"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("credentials_userId_idx").on(table.userId)],
);

export const authSessionsRelations = relations(authSessions, ({ one }) => ({
  user: one(user, { fields: [authSessions.userId], references: [user.id] }),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(user, { fields: [passwordResetTokens.userId], references: [user.id] }),
}));

export const credentialsRelations = relations(credentials, ({ one }) => ({
  user: one(user, { fields: [credentials.userId], references: [user.id] }),
}));
