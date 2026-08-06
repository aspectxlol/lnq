import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DrizzleService } from "../../db/drizzle.service";
import { sessions, users } from "../../db/schema";
import { DAYS } from "../../utils";

@Injectable()
export class SessionRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async create({
    userId,
    sessionId,
    refreshTokenHash,
    ip,
    userAgent,
  }: {
    userId: string;
    sessionId: string;
    refreshTokenHash: string;
    ip: string;
    userAgent: string;
  }) {
    return (
      await this.drizzle.db
        .insert(sessions)
        .values({
          id: sessionId,
          userId: userId,
          ipAddress: ip,
          userAgent: userAgent,
          expiresAt: new Date(Date.now() + 30 * DAYS),
          refreshTokenHash: refreshTokenHash,
          lastUsedAt: new Date(),
        })
        .returning()
    )[0];
  }

  async updateRefreshToken(id: string, refreshTokenHash: string) {
    return (
      await this.drizzle.db
        .update(sessions)
        .set({
          refreshTokenHash,
          expiresAt: new Date(Date.now() + 30 * DAYS),
          lastUsedAt: new Date(),
        })
        .where(eq(sessions.id, id))
        .returning()
    )[0];
  }

  async updateRevokedAt(id: string) {
    return await this.drizzle.db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(eq(sessions.id, id));
  }

  async findByIdWithUser(id: string) {
    const data = (
      await this.drizzle.db
        .select()
        .from(sessions)
        .where(eq(sessions.id, id))
        .leftJoin(users, eq(sessions.userId, users.id))
    )[0];

    return {
      session: data.sessions,
      user: data.users,
    };
  }
}
