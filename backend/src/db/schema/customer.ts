import {
  boolean,
  index,
  numeric,
  pgTable,
  primaryKey,
  text,
  uuid,
} from "drizzle-orm/pg-core";

import { users } from "./auth";
import { timestamps } from "./common";

export const addresses = pgTable(
  "addresses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),

    label: text("label").notNull(),

    recipientName: text("recipient_name").notNull(),
    recipientPhone: text("recipient_phone").notNull(),

    street: text("street").notNull(),

    city: text("city").notNull(),
    province: text("province").notNull(),
    postalCode: text("postal_code").notNull(),

    country: text("country").notNull().default("Indonesia"),

    notes: text("notes"),

    latitude: numeric("latitude", { precision: 10, scale: 8 }),
    longitude: numeric("longitude", { precision: 11, scale: 8 }),

    isDefault: boolean("is_default").notNull().default(false),

    ...timestamps,
  },
  (table) => ({
    pk: primaryKey(table.userId, table.label),
    userIdIdx: index("user_id_idx").on(table.userId),
  }),
);

export type Address = typeof addresses.$inferSelect;
export type NewAddress = typeof addresses.$inferInsert;
