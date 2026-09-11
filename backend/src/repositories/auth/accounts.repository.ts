import { Injectable } from "@nestjs/common";
import { DrizzleService } from "../../db/drizzle.service";
import {
  Account,
  accounts,
  AuthProvider,
  NewAccount,
  users,
} from "../../db/schema";
import { and, eq } from "drizzle-orm";

@Injectable()
export class AccountRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async create(payload: NewAccount): Promise<Account> {
    return (
      await this.drizzle.db.insert(accounts).values(payload).returning()
    )[0];
  }

  async findProviderByAccountIdWithUser(
    provider: AuthProvider,
    providerAccountId: string,
  ) {
    return (
      await this.drizzle.db
        .select()
        .from(accounts)
        .where(
          and(
            eq(accounts.provider, provider),
            eq(accounts.providerAccountId, providerAccountId),
          ),
        )
        .leftJoin(users, eq(accounts.userId, users.id))
    )[0];
  }

  findByUserId(userId: string) {
    return this.drizzle.db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, userId));
  }
}
