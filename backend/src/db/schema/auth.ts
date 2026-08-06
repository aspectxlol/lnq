import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { timestamps } from "./common";

export const roles = pgEnum("roles", ["CUSTOMER", "ADMIN", "OWNER", "STAFF"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),

  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  role: roles("role").notNull().default("CUSTOMER"),

  phoneVerifiedAt: timestamp("phone_verified_at"),
  emailVerifiedAt: timestamp("email_verified_at"),

  isActive: boolean("is_active").notNull().default(true),

  ...timestamps,
});

export const oauthProviders = pgEnum("oauth_provider", [
  "GOOGLE",
  "FACEBOOK",
  "APPLE",
  "GITHUB",
]);

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    provider: oauthProviders("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),

    ...timestamps,
  },
  (table) => [
    unique().on(table.provider, table.providerAccountId),
    index("idx_accounts_user_id").on(table.userId),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    ipAddress: text("ip_address").notNull(),
    userAgent: text("user_agent").notNull(),

    refreshTokenHash: text("refresh_token_hash").notNull(),

    revokedAt: timestamp("revoked_at"),
    expiresAt: timestamp("expires_at").notNull(),
    lastUsedAt: timestamp("last_used_at").notNull().defaultNow(),

    ...timestamps,
  },
  (table) => [
    index("idx_sessions_user_id").on(table.userId),
    index("idx_sessions_expires_at").on(table.expiresAt),
  ],
);

export const authTokenTypes = pgEnum("auth_token_type", [
  "PHONE_VERIFICATION",
  "EMAIL_VERIFICATION",
  "PASSWORD_RESET",
  "EMAIL_CHANGE",
  "PHONE_CHANGE",
  "MAGIC_LINK",
]);

export const authTokens = pgTable(
  "auth_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: authTokenTypes("type").notNull(),
    target: text("target").notNull(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    consumedAt: timestamp("consumed_at"),

    ...timestamps,
  },
  (table) => [index("idx_auth_tokens_user_id").on(table.userId)],
);

export const invites = pgTable(
  "invites",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    code: text("code").notNull().unique(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    role: roles("role").notNull(),

    invitedBy: uuid("invited_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    expiresAt: timestamp("expires_at").notNull(),

    acceptedAt: timestamp("accepted_at"),
    revokedAt: timestamp("revoked_at"),

    ...timestamps,
  },
  (table) => [
    index("idx_invites_user_id").on(table.userId),
    index("idx_invites_invited_by").on(table.invitedBy),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type AuthToken = typeof authTokens.$inferSelect;
export type NewAuthToken = typeof authTokens.$inferInsert;

export type Invite = typeof invites.$inferSelect;
export type NewInvite = typeof invites.$inferInsert;
