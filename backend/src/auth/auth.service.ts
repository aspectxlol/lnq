/*
https://docs.nestjs.com/providers#services
*/

import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { RegisterDto } from "./dto/register.dto";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcrypt";
import { LoginDto } from "./dto/login.dto";
import * as jwt from "jsonwebtoken";
import { AuthUser } from "./interfaces/auth-user.interface";
import { JwtService } from "@nestjs/jwt/dist/jwt.service";
import { FastifyRequest } from "fastify";
import { JwtPayload, SafeUser } from "./interfaces/jwt.interface";
import { User } from "@prisma/client";
import { RefreshDto } from "./dto/refresh.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const user = await this.prismaService.user.findFirst({
      where: {
        email: registerDto.email,
      },
    });

    if (user) {
      throw new ConflictException("Email already exists");
    }

    const hash = await bcrypt.hash(registerDto.password, 10);

    // Create the user with the hashed password
    await this.prismaService.user.create({
      data: {
        name: registerDto.name,
        email: registerDto.email,
        passwordHash: hash,
      },
    });
  }

  async login(user: AuthUser, req: FastifyRequest) {
    const refreshToken = crypto.randomUUID(); // Generate a unique refresh token
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10); // Hash the refresh token

    const session = await this.prismaService.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: hashedRefreshToken,
        userAgent: req.headers["user-agent"] || "unknown",
        ipAddress: req.ip || "unknown",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Set expiration to 30 days
      },
    });
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionId: session.id,
    };

    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: refreshToken, // Return the plain refresh token to the client
      userid: user.id,
    };
  }

  async refresh(data: RefreshDto) {
    const session = await this.getValidSession(parseInt(data.sessionId));
    const isValidRefreshToken = await bcrypt.compare(
      data.refreshToken,
      session.refreshTokenHash,
    );

    if (!isValidRefreshToken) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const newRefreshToken = crypto.randomUUID(); // Generate a new unique refresh token
    const hashedNewRefreshToken = await bcrypt.hash(newRefreshToken, 10); // Hash the new refresh token
    await this.prismaService.session.update({
      where: {
        id: session.id,
      },
      data: {
        refreshTokenHash: hashedNewRefreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Extend expiration to 30 days
        lastUsedAt: new Date(), // Update the last used timestamp
      },
    });
    const payload: JwtPayload = {
      sub: session.user.id,
      email: session.user.email,
      role: session.user.role,
      sessionId: session.id,
    };

    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: newRefreshToken, // Return the new plain refresh token to the client
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

  async validateSession(payload: JwtPayload): Promise<SafeUser> {
    const session = await this.getValidSession(payload.sessionId);

    if (session.user.id !== payload.sub)
      throw new UnauthorizedException("Invalid session");
    const { passwordHash, ...userWithoutPassword } = session.user; // Exclude passwordHash from the returned user object
    return userWithoutPassword;
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
