import { relations } from "drizzle-orm";

import { users, accounts, sessions, authTokens, invites } from "./auth";
import {
  categories,
  products,
  productCategories,
  productImages,
  productOptions,
  productOptionValues,
  productVariants,
  productVariantValues,
} from "./catalog";
import { addresses } from "./customer";
import { orders, orderItems, orderItemOptions } from "./orders";
import { payments, coupons, couponUsages } from "./payment";
import { AuditLog } from "./admin";

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  authTokens: many(authTokens),
  invites: many(invites),
  createdInvites: many(invites, { relationName: "CreatedInvites" }),
  addresses: many(addresses),
  customerOrders: many(orders, { relationName: "CustomerOrders" }),
  createdOrders: many(orders, { relationName: "CreatedOrders" }),
  couponUsages: many(couponUsages),
  auditLogs: many(AuditLog),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users),
}));

export const authTokensRelations = relations(authTokens, ({ one }) => ({
  user: one(users),
}));

export const invitesRelations = relations(invites, ({ one }) => ({
  user: one(users),
  invitedBy: one(users, {
    relationName: "CreatedInvites",
    fields: [invites.invitedBy],
    references: [users.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  productCategories: many(productCategories),
}));

export const productsRelations = relations(products, ({ many }) => ({
  productCategories: many(productCategories),
  productImages: many(productImages),
  productOptions: many(productOptions),
  productVariants: many(productVariants),
  orderItems: many(orderItems),
}));

export const productCategoriesRelations = relations(
  productCategories,
  ({ one }) => ({
    product: one(products),
    category: one(categories),
  }),
);

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products),
}));

export const productOptionsRelations = relations(
  productOptions,
  ({ one, many }) => ({
    product: one(products),
    values: many(productOptionValues),
  }),
);

export const productOptionValuesRelations = relations(
  productOptionValues,
  ({ one, many }) => ({
    option: one(productOptions),
    variantValues: many(productVariantValues),
  }),
);

export const productVariantsRelations = relations(
  productVariants,
  ({ one, many }) => ({
    product: one(products),
    variantValues: many(productVariantValues),
    orderItems: many(orderItems),
  }),
);

export const productVariantValuesRelations = relations(
  productVariantValues,
  ({ one }) => ({
    variant: one(productVariants),
    optionValue: one(productOptionValues),
  }),
);

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(users),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(users, {
    relationName: "CustomerOrders",
    fields: [orders.userId],
    references: [users.id],
  }),
  createdBy: one(users, {
    relationName: "CreatedOrders",
    fields: [orders.createdBy],
    references: [users.id],
  }),
  address: one(addresses),
  orderItems: many(orderItems),
  couponUsages: many(couponUsages),
}));

export const orderItemsRelations = relations(orderItems, ({ one, many }) => ({
  order: one(orders),
  product: one(products),
  productVariant: one(productVariants),
  orderItemOptions: many(orderItemOptions),
}));

export const orderItemOptionsRelations = relations(
  orderItemOptions,
  ({ one }) => ({
    orderItem: one(orderItems),
  }),
);

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders),
}));

export const couponsRelations = relations(coupons, ({ many }) => ({
  couponUsages: many(couponUsages),
}));

export const couponUsagesRelations = relations(couponUsages, ({ one }) => ({
  coupon: one(coupons),
  order: one(orders),
  user: one(users),
}));

export const auditLogRelations = relations(AuditLog, ({ one }) => ({
  user: one(users),
}));
