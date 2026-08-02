import { Injectable, OnModuleDestroy } from "@nestjs/common";
import postgres from "postgres";
import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

@Injectable()
export class DrizzleService implements OnModuleDestroy {
  private readonly client = postgres(process.env.DATABASE_URL!, {
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
    max: 10,
  });

  readonly db: PostgresJsDatabase<typeof schema> = drizzle(this.client, {
    schema,
  });

  async onModuleDestroy() {
    this.client.end();
    // Cleanup logic if needed
  }
}
