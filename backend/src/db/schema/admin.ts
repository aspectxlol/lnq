import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  pgEnum,
  primaryKey,
  unique,
  index,
  numeric,
  jsonb,
} from "drizzle-orm/pg-core";
import { users } from "./auth";

export const auditActions = pgEnum("audit_action", [
  "CREATE",
  "UPDATE",
  "DELETE",
  "LOGIN",
  "LOGOUT",
]);

export const AuditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),

    action: auditActions("action").notNull(),

    entity: text("entity").notNull(),

    entityId: uuid("entity_id"),

    changes: jsonb("changes"),

    ipAddress: text("ip_address"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIndex: index("audit_log_user_id_index").on(table.userId),
    entityIndex: index("audit_log_entity_index").on(table.entity),
    entityIdIndex: index("audit_log_entity_id_index").on(table.entityId),
  }),
);

export type AuditLogEntry = typeof AuditLog.$inferSelect;
export type NewAuditLogEntry = typeof AuditLog.$inferInsert;
