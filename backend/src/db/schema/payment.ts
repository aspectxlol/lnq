import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { users } from "./auth";
import { timestamps } from "./common";
import { orders } from "./orders";

export const paymentProviders = pgEnum("payment_provider", [
  "MIDTRANS",
  "STRIPE",
  "PAYPAL",
  "OTHER",
]);

export const paymentMethods = pgEnum("payment_method", [
  "CASH",
  "QRIS",
  "BANK_TRANSFER",
  "OTHER",
]);

export const paymentStatuses = pgEnum("payment_status", [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
  "CANCELLED",
]);

export const couponTypes = pgEnum("coupon_type", ["PERCENTAGE", "FIXED"]);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, {
        onDelete: "cascade",
      })
      .unique(),

    provider: paymentProviders("provider"),

    transactionId: text("transaction_id"),

    method: paymentMethods("method"),

    status: paymentStatuses("status").notNull().default("PENDING"),

    amount: integer("amount").notNull(),

    metadata: jsonb("metadata"),

    paidAt: timestamp("paid_at"),

    ...timestamps,
  },
  (table) => [
    index("idx_payments_status").on(table.status),
    index("idx_payments_transaction").on(table.transactionId),
  ],
);

export const coupons = pgTable(
  "coupons",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    code: text("code").notNull().unique(),

    type: couponTypes("type").notNull(),

    value: integer("value").notNull(),

    description: text("description"),

    minimumPurchase: integer("minimum_purchase"),

    maxDiscount: integer("max_discount"),

    maxUses: integer("max_uses"),

    usedCount: integer("used_count").notNull().default(0),

    isActive: boolean("is_active").notNull().default(true),

    startsAt: timestamp("starts_at"),

    expiresAt: timestamp("expires_at"),

    ...timestamps,
  },
  (table) => [
    index("idx_coupons_code").on(table.code),
    index("idx_coupons_active").on(table.isActive),
    index("idx_coupons_expires_at").on(table.expiresAt),
  ],
);

export const couponUsages = pgTable(
  "coupon_usages",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    couponId: uuid("coupon_id")
      .notNull()
      .references(() => coupons.id, {
        onDelete: "cascade",
      }),

    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, {
        onDelete: "cascade",
      }),

    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),

    couponCode: text("coupon_code").notNull(),

    discountApplied: integer("discount_applied").notNull(),

    ...timestamps,
  },
  (table) => [
    unique().on(table.couponId, table.orderId),

    index("idx_coupon_usage_coupon").on(table.couponId),
    index("idx_coupon_usage_order").on(table.orderId),
    index("idx_coupon_usage_user").on(table.userId),
  ],
);

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

export type Coupon = typeof coupons.$inferSelect;
export type NewCoupon = typeof coupons.$inferInsert;

export type CouponUsage = typeof couponUsages.$inferSelect;
export type NewCouponUsage = typeof couponUsages.$inferInsert;
