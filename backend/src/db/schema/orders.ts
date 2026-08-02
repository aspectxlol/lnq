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
} from "drizzle-orm/pg-core";

import { timestamps } from "./common";
import { users } from "./auth";
import { products, productVariants } from "./catalog";
import { addresses } from "./customer";

export const orderStatus = pgEnum("order_status", [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
]);

export const orderSource = pgEnum("order_source", [
  "ONLINE",
  "WHATSAPP",
  "INSTAGRAM",
  "PHONE",
  "WALK_IN",
  "ADMIN",
]);

export const fulfillmentMethods = pgEnum("fulfillment_methods", [
  "PICKUP",
  "DELIVERY",
]);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),

    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "cascade",
    }),

    orderNumber: text("order_number").notNull().unique(),

    source: orderSource("source").notNull().default("ONLINE"),
    status: orderStatus("status").notNull().default("PENDING"),

    customerName: text("customer_name").notNull(),
    customerEmail: text("customer_email").notNull(),
    customerPhone: text("customer_phone").notNull(),

    subTotal: integer("sub_total").notNull(),
    discount: integer("discount").notNull().default(0),
    tax: integer("tax").notNull().default(0),
    total: integer("total").notNull(),

    pickupDate: timestamp("pickup_date"),

    completedAt: timestamp("completed_at"),

    notes: text("notes"),

    fulfillmentMethod: fulfillmentMethods("fulfillment_method").notNull(),

    addressId: uuid("address_id").references(() => addresses.id, {
      onDelete: "cascade",
    }),

    recipientName: text("recipient_name").notNull(),
    recipientPhone: text("recipient_phone").notNull(),

    street: text("street").notNull(),

    city: text("city").notNull(),
    province: text("province").notNull(),
    postalCode: text("postal_code").notNull(),

    country: text("country").notNull().default("Indonesia"),

    addressNotes: text("address_notes"),

    latitude: numeric("latitude", { precision: 10, scale: 8 }),
    longitude: numeric("longitude", { precision: 11, scale: 8 }),

    ...timestamps,
  },
  (table) => [
    index("idx_orders_user").on(table.userId),
    index("idx_orders_created_by").on(table.createdBy),
    index("idx_orders_status").on(table.status),
    index("idx_orders_source").on(table.source),
    index("idx_orders_pickup_date").on(table.pickupDate),
    index("idx_orders_address").on(table.addressId),
    index("idx_orders_created_at").on(table.createdAt),
  ],
);

export const itemTypes = pgEnum("item_types", ["PRODUCT", "CUSTOM", "FEE"]);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),

    itemType: itemTypes("item_type").notNull().default("PRODUCT"),

    productId: uuid("product_id").references(() => products.id, {
      onDelete: "cascade",
    }),

    name: text("product_name").notNull(),
    sku: text("product_sku"),

    productVariantId: uuid("product_variant_id").references(
      () => productVariants.id,
      {
        onDelete: "cascade",
      },
    ),
    productVariantName: text("product_variant_name"),
    productVariantSku: text("product_variant_sku"),

    unitPrice: integer("unit_price").notNull(),
    quantity: integer("quantity").notNull().default(1),

    notes: text("notes"),
  },
  (table) => [
    index("idx_order_items_order").on(table.orderId),
    index("idx_order_items_product").on(table.productId),
    index("idx_order_items_variant").on(table.productVariantId),
  ],
);

export const orderItemOptions = pgTable(
  "order_item_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    orderItemId: uuid("order_item_id")
      .notNull()
      .references(() => orderItems.id, {
        onDelete: "cascade",
      }),

    optionName: text("option_name").notNull(),
    optionValue: text("option_value").notNull(),

    additionalPrice: integer("additional_price").notNull().default(0),

    ...timestamps,
  },
  (table) => [index("idx_order_item_options_order_item").on(table.orderItemId)],
);

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;

export type OrderItemOption = typeof orderItemOptions.$inferSelect;
export type NewOrderItemOption = typeof orderItemOptions.$inferInsert;
