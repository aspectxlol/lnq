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
import { AuthUser } from "./interfaces/auth-user.interface";
import { JwtService } from "@nestjs/jwt/dist/jwt.service";
import { FastifyReply, FastifyRequest } from "fastify";
import { JwtPayload, SafeUser } from "./interfaces/jwt.interface";

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

  async login(user: AuthUser, req: FastifyRequest, reply: FastifyReply) {
    let session, refreshToken;
    await this.prismaService.$transaction(async (prisma) => {
      session = await prisma.session.create({
        data: {
          userId: user.id,
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"] || "unknown",
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Set expiration to 30 days
          refreshTokenHash: "", // Placeholder, will be updated after hashing the refresh token
        },
      });

      refreshToken = this.jwtService.sign(
        { sessionId: session.id },
        { expiresIn: "30d" },
      );
      const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

      await prisma.session.update({
        where: {
          id: session.id,
        },
        data: {
          refreshTokenHash: hashedRefreshToken,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Set expiration to 30 days
          lastUsedAt: new Date(), // Set the last used timestamp
        },
      });
    });

    const payload: JwtPayload = {
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
      maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
    });

    return {
      access_token: this.jwtService.sign(payload),
      userid: user.id,
    };
  }

  async refresh(req: FastifyRequest, reply: FastifyReply) {
    const refreshToken = req.cookies["refresh_token"];
    if (!refreshToken)
      throw new UnauthorizedException("Refresh token not found");
    // decode the refresh token to get the sessionId
    const { sessionId } = this.jwtService.verify(refreshToken);

    const session = await this.getValidSession(parseInt(sessionId));
    const isValidRefreshToken = await bcrypt.compare(
      refreshToken,
      session.refreshTokenHash,
    );

    if (!isValidRefreshToken) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const newRefreshToken = this.jwtService.sign(
      { sessionId: sessionId },
      { expiresIn: "30d" },
    ); // Generate a new unique refresh token
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

    reply.setCookie("refresh_token", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/auth/refresh",
      maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
    });

    return {
      access_token: this.jwtService.sign(payload),
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
