/*
https://docs.nestjs.com/providers#services
*/

import type {
  LoginResponse,
  LogoutResponse,
  MeResponse,
  RefreshResponse,
  RegisterInput,
} from "@lnq/shared";
import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { FastifyReply, FastifyRequest } from "fastify";
import * as RefreshJwt from "jsonwebtoken";

import { SessionRepository, UserRepository } from "../repositories/auth";
import { DAYSINSECONDS } from "../utils";
import { AuthUser } from "./interfaces/auth-user.interface";
import type {
  AccessJwtPayload,
  RefreshJwtPayload,
  SafeUser,
} from "./interfaces/jwt.interface";

@Injectable()
export class AuthService {
  private readonly RefreshJwt = RefreshJwt;
  private readonly logger: Logger = new Logger(AuthService.name);
  private readonly dummyPasswordHash =
    "$2a$12$gTStWrVLvBgHg8V8W6db7uaA3VY9kiHpKscpUhBJBL8zRoLuqeVpC";
  constructor(
    // private readonly drizzle: DrizzleService,
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly AccessJwtService: JwtService,
  ) {}

  async register(
    registerDto: RegisterInput,
    req: FastifyRequest,
    res: FastifyReply,
  ): Promise<LoginResponse> {
    if (await this.userRepository.findByEmail(registerDto.email)) {
      throw new ConflictException("Email already exists");
    }

    const hash = await bcrypt.hash(registerDto.password, 10);
    const user = await this.userRepository.create({
      name: registerDto.name,
      email: registerDto.email,
      passwordHash: hash,
    });

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
    const sessionId = crypto.randomUUID();

    const refreshToken = this.RefreshJwt.sign(
      { sid: sessionId },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "30d" },
    );

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    await this.sessionRepository.create({
      sessionId,
      userId: user.id,
      refreshTokenHash,
      ip: req.ip,
      userAgent: req.headers["user-agent"] || "Unknown",
    });

    const payload: AccessJwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionId: sessionId,
    };

    reply.setCookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/auth/refresh",
      maxAge: 30 * DAYSINSECONDS, // 30 days in seconds
    });

    return {
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
      await this.sessionRepository.updateRevokedAt(sessionId);
      throw new UnauthorizedException("Invalid refresh token");
    }

    await this.rotateRefreshToken(sessionId, reply);

    return {
      access_token: this.AccessJwtService.sign({
        sub: user.id,
        email: user.email,
        role: user.role,
        sessionId: session.id,
      } as AccessJwtPayload),
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

    await this.sessionRepository.updateRevokedAt(sessionId);

    res.clearCookie("refresh_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/auth/refresh",
    });

    return {
      message: "Logged out successfully",
      timestamp: new Date().toISOString(),
    };
  }

  async me(user: AuthUser): Promise<MeResponse> {
    const dbUser = await this.userRepository.findById(user.id);
    if (!dbUser) throw new UnauthorizedException("User not found");
    if (!dbUser.isActive) throw new UnauthorizedException("User is inactive");

    return {
      id: dbUser.id,

      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      phone: dbUser.phone,

      createdAt: dbUser.createdAt,
      emailVerifiedAt: dbUser.emailVerifiedAt,
      phoneVerifiedAt: dbUser.phoneVerifiedAt,
      updatedAt: dbUser.updatedAt,
      isActive: dbUser.isActive,
    };
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<AuthUser | null> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) return null;
    if (!user.isActive) return null;

    if (!user) {
      await bcrypt.compare(password, this.dummyPasswordHash);
      return null;
    }

    if (!(await bcrypt.compare(password, user.passwordHash!))) return null;

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = result.user; // Exclude passwordHash from the returned user object
    return userWithoutPassword;
  }

  private async verifyRefreshToken(refreshToken): Promise<RefreshJwtPayload> {
    let verified: RefreshJwtPayload;
    try {
      verified = this.RefreshJwt.verify(
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
    const result = await this.sessionRepository.findByIdWithUser(sessionId);
    if (!result) throw new UnauthorizedException("No Session Found");

    const { session, user } = result;

    if (!session) throw new UnauthorizedException("Invalid session");
    if (session.revokedAt) throw new UnauthorizedException("Session revoked");
    if (session.expiresAt < new Date())
      throw new UnauthorizedException("Session expired");

    if (!user?.isActive) throw new UnauthorizedException("User is inactive");

    return {
      session: session,
      user,
    };
  }

  private async rotateRefreshToken(
    sessionId: string,
    reply: FastifyReply,
  ): Promise<void> {
    const newRefreshToken = this.RefreshJwt.sign(
      { sid: sessionId },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "30d" },
    ); // Generate a new unique refresh token

    const hashedNewRefreshToken = await bcrypt.hash(newRefreshToken, 10); // Hash the new refresh token
    await this.sessionRepository.updateRefreshToken(
      sessionId,
      hashedNewRefreshToken,
    );

    reply.setCookie("refresh_token", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/auth/refresh",
      maxAge: 30 * DAYSINSECONDS, // 30 days in seconds
    });
  }
}
