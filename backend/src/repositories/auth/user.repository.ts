import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";

import { DrizzleService } from "../../db/drizzle.service";
import { User, users } from "../../db/schema";

@Injectable()
export class UserRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findById(id: string): Promise<User | undefined> {
    const user = await this.drizzle.db
      .select()
      .from(users)
      .where(eq(users.id, id));
    return user[0];
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const user = await this.drizzle.db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user[0];
  }

  async create(payload: {
    name: string;
    email: string;
    passwordHash: string;
  }): Promise<User> {
    const user = await this.drizzle.db
      .insert(users)
      .values(payload)
      .returning();

    return user[0];
  }
}
