import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DrizzleService } from "../../db/drizzle.service";
import {
  categories,
  productCategories,
  productImages,
  productOptionValues,
  productOptions,
  productVariants,
  productVariantValues,
  products,
} from "../../db/schema";

@Injectable()
export class ProductRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findById(id: string) {
    return this.drizzle.db.select().from(products).where(eq(products.id, id));
  }

  async findBySlug(slug: string) {
    return this.drizzle.db
      .select()
      .from(products)
      .where(eq(products.slug, slug));
  }

  async list({ status }: { status?: string } = {}) {
    if (status) {
      return this.drizzle.db
        .select()
        .from(products)
        .where(eq(products.status, status as any));
    }

    return this.drizzle.db.select().from(products);
  }

  async create(data: typeof products.$inferInsert) {
    return this.drizzle.db.insert(products).values(data).returning();
  }

  async update(id: string, data: Partial<typeof products.$inferInsert>) {
    return this.drizzle.db
      .update(products)
      .set(data)
      .where(eq(products.id, id))
      .returning();
  }

  async delete(id: string) {
    return this.drizzle.db
      .delete(products)
      .where(eq(products.id, id))
      .returning();
  }

  async listCategories() {
    return this.drizzle.db.select().from(categories);
  }

  async createCategory(data: typeof categories.$inferInsert) {
    return this.drizzle.db.insert(categories).values(data).returning();
  }

  async attachCategory(productId: string, categoryId: string) {
    return this.drizzle.db
      .insert(productCategories)
      .values({ productId, categoryId });
  }

  async listImages(productId: string) {
    return this.drizzle.db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, productId));
  }

  async addImage(data: typeof productImages.$inferInsert) {
    return this.drizzle.db.insert(productImages).values(data).returning();
  }

  async listOptions(productId: string) {
    return this.drizzle.db
      .select()
      .from(productOptions)
      .where(eq(productOptions.productId, productId));
  }

  async addOption(data: typeof productOptions.$inferInsert) {
    return this.drizzle.db.insert(productOptions).values(data).returning();
  }

  async listOptionValues(optionId: string) {
    return this.drizzle.db
      .select()
      .from(productOptionValues)
      .where(eq(productOptionValues.productOptionId, optionId));
  }

  async addOptionValue(data: typeof productOptionValues.$inferInsert) {
    return this.drizzle.db.insert(productOptionValues).values(data).returning();
  }

  async listVariants(productId: string) {
    return this.drizzle.db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, productId));
  }

  async addVariant(data: typeof productVariants.$inferInsert) {
    return this.drizzle.db.insert(productVariants).values(data).returning();
  }

  async attachVariantValue(variantId: string, optionValueId: string) {
    return this.drizzle.db
      .insert(productVariantValues)
      .values({ variantId, optionValueId });
  }
}
