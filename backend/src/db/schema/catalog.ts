import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { timestamps } from "./common";

export const productStatus = pgEnum("product_status", [
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
]);

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),

  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),

  description: text("description"),

  sortOrder: integer("sort_order").notNull().default(0),

  isVisible: boolean("is_visible").notNull().default(true),

  ...timestamps,
});

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    name: text("name").notNull(),

    slug: text("slug").notNull().unique(),

    description: text("description"),

    status: productStatus("status").notNull().default("DRAFT"),

    ...timestamps,
  },
  (table) => [
    index("idx_products_name").on(table.name),
    index("idx_products_status").on(table.status),
  ],
);

export const productCategories = pgTable(
  "product_categories",
  {
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),

    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({
      columns: [table.productId, table.categoryId],
    }),
    index("idx_product_categories_category").on(table.categoryId),
    index("idx_product_categories_product").on(table.productId),
  ],
);

export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),

    objectKey: text("object_key").notNull(),

    altText: text("alt_text"),

    sortOrder: integer("sort_order").notNull().default(0),

    ...timestamps,
  },
  (table) => [index("idx_product_images_product").on(table.productId)],
);

export const productOptions = pgTable(
  "product_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),

    name: text("name").notNull(),

    required: boolean("required").notNull().default(true),

    sortOrder: integer("sort_order").notNull().default(0),

    ...timestamps,
  },
  (table) => [
    unique().on(table.productId, table.name),
    index("idx_product_options_product").on(table.productId),
  ],
);

export const productOptionValues = pgTable(
  "product_option_values",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    productOptionId: uuid("product_option_id")
      .notNull()
      .references(() => productOptions.id, {
        onDelete: "cascade",
      }),

    value: text("value").notNull(),

    sortOrder: integer("sort_order").notNull().default(0),

    ...timestamps,
  },
  (table) => [
    unique().on(table.productOptionId, table.value),
    index("idx_option_values_option").on(table.productOptionId),
  ],
);

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, {
        onDelete: "cascade",
      }),

    slug: text("slug").notNull().unique(),

    title: text("title").notNull(),

    sku: text("sku").unique(),

    sellingPrice: integer("selling_price").notNull(),

    isAvailable: boolean("is_available").notNull().default(true),

    ...timestamps,
  },
  (table) => [index("idx_variants_product").on(table.productId)],
);

export const productVariantValues = pgTable(
  "product_variant_values",
  {
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, {
        onDelete: "cascade",
      }),

    optionValueId: uuid("option_value_id")
      .notNull()
      .references(() => productOptionValues.id, {
        onDelete: "cascade",
      }),
  },
  (table) => [
    primaryKey({
      columns: [table.variantId, table.optionValueId],
    }),
  ],
);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type ProductImage = typeof productImages.$inferSelect;
export type NewProductImage = typeof productImages.$inferInsert;

export type ProductOption = typeof productOptions.$inferSelect;
export type NewProductOption = typeof productOptions.$inferInsert;

export type ProductOptionValue = typeof productOptionValues.$inferSelect;
export type NewProductOptionValue = typeof productOptionValues.$inferInsert;

export type ProductVariant = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;
