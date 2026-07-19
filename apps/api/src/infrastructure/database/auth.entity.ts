import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, index, pgEnum, uniqueIndex } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  // username plugin fields
  username: text("username").notNull().unique(),
  displayUsername: text("display_username"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const userRelations = relations(user, ({ many }) => ({
  authSessions: many(authSessions),
  credentials: many(credentials),
}));

// --- In-house auth module tables (issue #29) ---

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

export const securityAnswers = pgTable("security_answers", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  answerHash: text("answer_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

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

export const securityAnswersRelations = relations(securityAnswers, ({ one }) => ({
  user: one(user, { fields: [securityAnswers.userId], references: [user.id] }),
}));

export const credentialsRelations = relations(credentials, ({ one }) => ({
  user: one(user, { fields: [credentials.userId], references: [user.id] }),
}));
