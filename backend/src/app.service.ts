import { Injectable } from "@nestjs/common";

import { DrizzleService } from "./db/drizzle.service";

@Injectable()
export class AppService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getHealthCheck() {
    try {
      await this.drizzle.db.select();
      return {
        status: 200,
        message: "ok",
        database: "ok",
      };
    } catch {
      return {
        status: 503,
        message: "database unavailable",
      };
    }
  }
}
