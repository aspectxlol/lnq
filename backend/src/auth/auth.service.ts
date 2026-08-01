/*
https://docs.nestjs.com/providers#services
*/

import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { RegisterDto } from "./dto/register.dto";
import { PrismaService } from "../prisma/prisma.service";
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
import { Prisma } from "@prisma/client";

@Injectable()
export class AuthService {
  private readonly RefreshJwtService = RefreshJwt;
  private readonly logger: Logger = new Logger(AuthService.name);
  constructor(
    private readonly prismaService: PrismaService,
    private readonly AccessJwtService: JwtService,
  ) {}

  async register(
    registerDto: RegisterDto,
    req: FastifyRequest,
    res: FastifyReply,
  ) {
    try {
      await this.prismaService.user.findFirst({
        where: {
          email: registerDto.email,
        },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      )
        throw new ConflictException("Email already exists");
    }

    const hash = await bcrypt.hash(registerDto.password, 10);

    // Create the user with the hashed password
    const user = await this.prismaService.user.create({
      data: {
        name: registerDto.name,
        email: registerDto.email,
        passwordHash: hash,
      },
    });

    const authUser: AuthUser = {
      email: user.email,
      id: user.id,
      role: user.role,
    };

    return this.login(authUser, req, res);
  }

  async login(user: AuthUser, req: FastifyRequest, reply: FastifyReply) {
    let session, refreshToken;
    await this.prismaService.$transaction(async (prisma) => {
      session = await prisma.session.create({
        data: {
          userId: user.id,
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"] || "unknown",
          expiresAt: new Date(Date.now() + 30 * DAYS), // Set expiration to 30 days
          refreshTokenHash: "", // Placeholder, will be updated after hashing the refresh token
        },
      });

      refreshToken = this.RefreshJwtService.sign(
        { sid: session.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "30d" },
      );
      const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

      await prisma.session.update({
        where: {
          id: session.id,
        },
        data: {
          refreshTokenHash: hashedRefreshToken,
          lastUsedAt: new Date(), // Set the last used timestamp
        },
      });
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
      access_token: this.AccessJwtService.sign(payload),
      userid: user.id,
    };
  }

  async refresh(req: FastifyRequest, reply: FastifyReply) {
    const refreshToken = req.cookies["refresh_token"];
    if (!refreshToken)
      throw new UnauthorizedException("Refresh token not found");
    const { sid: sessionId } = await this.verifyRefreshToken(refreshToken);
    const session = await this.getValidSession(sessionId);
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
    await this.prismaService.session.update({
      where: {
        id: session.id,
      },
      data: {
        refreshTokenHash: hashedNewRefreshToken,
        expiresAt: new Date(Date.now() + 30 * DAYS), // Extend expiration to 30 days
        lastUsedAt: new Date(), // Update the last used timestamp
      },
    });
    const payload: AccessJwtPayload = {
      sub: session.user.id,
      email: session.user.email,
      role: session.user.role,
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
      access_token: this.AccessJwtService.sign(payload),
    };
  }

  async logout(req: FastifyRequest, res: FastifyReply) {
    const refreshToken = req.cookies["refresh_token"];
    if (!refreshToken)
      throw new UnauthorizedException("Refresh token not found");
    const { sid: sessionId } = await this.verifyRefreshToken(refreshToken);
    await this.prismaService.session.update({
      where: {
        id: sessionId,
      },
      data: {
        revokedAt: new Date(),
        revokeReason: "LOGOUT",
      },
    });

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

  async validateUser(
    email: string,
    password: string,
  ): Promise<AuthUser | null> {
    const user = await this.prismaService.user.findUnique({
      where: {
        email: email,
      },
    });

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
    const session = await this.getValidSession(payload.sessionId);

    if (session.user.id !== payload.sub)
      throw new UnauthorizedException("Invalid session");
    const { passwordHash, ...userWithoutPassword } = session.user; // Exclude passwordHash from the returned user object
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

  private async getValidSession(sessionId: number) {
    const session = await this.prismaService.session.findUnique({
      where: {
        id: sessionId,
      },
      include: {
        user: true,
      },
    });

    if (!session) throw new UnauthorizedException("Invalid session");
    if (session.revokedAt) throw new UnauthorizedException("Session revoked");
    if (session.expiresAt < new Date())
      throw new UnauthorizedException("Session expired");

    if (!session.user.isActive)
      throw new UnauthorizedException("User is inactive");

    return session;
  }
}
