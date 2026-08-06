/*
https://docs.nestjs.com/providers#services
*/

import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { AuthUser } from "./interfaces/auth-user.interface";
import { JwtService } from "@nestjs/jwt";
import { FastifyReply, FastifyRequest } from "fastify";
import type {
  AccessJwtPayload,
  RefreshJwtPayload,
  SafeUser,
} from "./interfaces/jwt.interface";
import * as RefreshJwt from "jsonwebtoken";
import { DAYS, DAYSINSECONDS } from "../utils";
import { DrizzleService } from "../db/drizzle.service";
import { sessions, users } from "../db/schema";
import { eq } from "drizzle-orm";

import type {
  LoginResponse,
  LogoutResponse,
  MeResponse,
  RefreshResponse,
  RegisterInput,
} from "@lnq/shared";
import { RegisterDto } from "./dto/register.dto";

@Injectable()
export class AuthService {
  private readonly RefreshJwtService = RefreshJwt;
  private readonly logger: Logger = new Logger(AuthService.name);
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly AccessJwtService: JwtService,
  ) {}

  async register(
    registerDto: RegisterDto,
    req: FastifyRequest,
    res: FastifyReply,
  ): Promise<LoginResponse> {
    const existingUser = await this.drizzle.db
      .select()
      .from(users)
      .where(eq(users.email, registerDto.email));

    if (existingUser.length > 0) {
      throw new ConflictException("Email already exists");
    }

    const hash = await bcrypt.hash(registerDto.password, 10);

    // Create the user with the hashed password
    const user = (
      await this.drizzle.db
        .insert(users)
        .values({
          name: registerDto.name,
          email: registerDto.email,
          passwordHash: hash,
        })
        .returning()
    )[0];

    const authUser: AuthUser = {
      email: user.email,
      id: user.id,
      role: user.role,
    };

    return this.login(authUser, req, res);
  }

  async login(
    user: AuthUser,
    req: FastifyRequest,
    reply: FastifyReply,
  ): Promise<LoginResponse> {
    let session, refreshToken;
    await this.drizzle.db.transaction(async (tx) => {
      session = (
        await tx
          .insert(sessions)
          .values({
            userId: user.id,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"] || "unknown",
            expiresAt: new Date(Date.now() + 30 * DAYS), // Set expiration to 30 days
            refreshTokenHash: "", // Placeholder
          })
          .returning()
      )[0];

      refreshToken = this.RefreshJwtService.sign(
        { sid: session.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "30d" },
      );
      const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

      await tx
        .update(sessions)
        .set({
          refreshTokenHash: hashedRefreshToken,
          lastUsedAt: new Date(), // Set the last used timestamp
        })
        .where(eq(sessions.id, session.id));
    });

    const payload: AccessJwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionId: session.id,
    };

    reply.setCookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/auth/refresh",
      maxAge: 30 * DAYSINSECONDS, // 30 days in seconds
    });

    return {
      success: true,
      access_token: this.AccessJwtService.sign(payload),
      userid: user.id,
    };
  }

  async refresh(
    req: FastifyRequest,
    reply: FastifyReply,
  ): Promise<RefreshResponse> {
    const refreshToken = req.cookies["refresh_token"];
    if (!refreshToken)
      throw new UnauthorizedException("Refresh token not found");
    const { sid: sessionId } = await this.verifyRefreshToken(refreshToken);
    const { session, user } = await this.getValidSession(sessionId);
    const isValidRefreshToken = await bcrypt.compare(
      refreshToken,
      session.refreshTokenHash,
    );

    if (!isValidRefreshToken) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const newRefreshToken = this.RefreshJwtService.sign(
      { sid: sessionId },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "30d" },
    ); // Generate a new unique refresh token
    const hashedNewRefreshToken = await bcrypt.hash(newRefreshToken, 10); // Hash the new refresh token
    // await this.prismaService.session.update({
    //   where: {
    //     id: session.id,
    //   },
    //   data: {
    //     refreshTokenHash: hashedNewRefreshToken,
    //     expiresAt: new Date(Date.now() + 30 * DAYS), // Extend expiration to 30 days
    //     lastUsedAt: new Date(), // Update the last used timestamp
    //   },
    // });
    await this.drizzle.db
      .update(sessions)
      .set({
        refreshTokenHash: hashedNewRefreshToken,
        expiresAt: new Date(Date.now() + 30 * DAYS), // Extend expiration to 30 days
        lastUsedAt: new Date(), // Update the last used timestamp
      })
      .where(eq(sessions.id, session.id));
    const payload: AccessJwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionId: session.id,
    };

    reply.setCookie("refresh_token", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/auth/refresh",
      maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
    });

    return {
      success: true,
      access_token: this.AccessJwtService.sign(payload),
    };
  }

  async logout(
    req: FastifyRequest,
    res: FastifyReply,
  ): Promise<LogoutResponse> {
    const refreshToken = req.cookies["refresh_token"];
    if (!refreshToken)
      throw new UnauthorizedException("Refresh token not found");
    const { sid: sessionId } = await this.verifyRefreshToken(refreshToken);
    await this.drizzle.db
      .update(sessions)
      .set({
        revokedAt: new Date(),
      })
      .where(eq(sessions.id, sessionId));

    res.clearCookie("refresh_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/auth/refresh",
    });

    return {
      success: true,
      message: "Logged out successfully",
      timestamp: new Date().toISOString(),
    };
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<AuthUser | null> {
    const user = (
      await this.drizzle.db.select().from(users).where(eq(users.email, email))
    )[0];

    if (!user) throw new UnauthorizedException("Invalid email or password");
    if (!(await bcrypt.compare(password, user.passwordHash!)))
      throw new UnauthorizedException("Invalid email or password");

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }

  async validateSession(payload: AccessJwtPayload): Promise<SafeUser> {
    const result = await this.getValidSession(payload.sessionId);

    if (result.user.id !== payload.sub)
      throw new UnauthorizedException("Invalid session");
    const { passwordHash, ...userWithoutPassword } = result.user; // Exclude passwordHash from the returned user object
    return userWithoutPassword;
  }

  async verifyRefreshToken(refreshToken): Promise<RefreshJwtPayload> {
    let verified: RefreshJwtPayload;
    try {
      verified = this.RefreshJwtService.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET,
      ) as RefreshJwtPayload;
    } catch (err) {
      // console.error("Refresh token verification failed:", err);
      this.logger.error("Refresh token verification failed:", err);
      throw new UnauthorizedException("Invalid refresh token");
    }
    return verified;
  }

  private async getValidSession(sessionId: string) {
    const session = (
      await this.drizzle.db
        .select()
        .from(sessions)
        .where(eq(sessions.id, String(sessionId)))
        .leftJoin(users, eq(sessions.userId, users.id))
    )[0];

    const user = session?.users;

    if (!session) throw new UnauthorizedException("Invalid session");
    if (session.sessions.revokedAt)
      throw new UnauthorizedException("Session revoked");
    if (session.sessions.expiresAt < new Date())
      throw new UnauthorizedException("Session expired");

    if (!user?.isActive) throw new UnauthorizedException("User is inactive");

    return {
      session: session.sessions,
      user: user,
    };
  }
}
