import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { createHash } from "crypto";
import { Profile } from "passport-google-oauth20";
import { PrismaService } from "../prisma/prisma.service";
import { RegisterAuthDto } from "./dto/register-auth.dto";

@Injectable()
export class AuthService {
  private readonly refreshTokens = new Map<string, { userId: string; expiresAt: Date }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async registerLocal(dto: RegisterAuthDto) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: dto.username }, { email: dto.email }],
      },
    });

    if (existing) {
      throw new ConflictException("Username or email already exists");
    }

    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        passwordHash: this.hashPassword(dto.password),
        provider: "local",
      },
    });

    return this.buildAuthResponse(user);
  }

  async validateLocalUser(identifier: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: identifier }, { email: identifier }],
      },
    });

    if (!user || !user.passwordHash) {
      return null;
    }

    if (user.passwordHash !== this.hashPassword(password)) {
      return null;
    }

    return this.sanitizeUser(user);
  }

  async loginLocal(identifier: string, password: string) {
    const user = await this.validateLocalUser(identifier, password);
    if (!user) {
      return null;
    }

    return this.buildAuthResponse(user as never);
  }

  async getAuthenticatedUser(id: string) {
    const user = await this.prisma.user.findFirst({ where: { id } });
    if (!user) {
      return null;
    }

    return this.sanitizeUser(user);
  }

  async handleGoogleAuth(profile: Profile) {
    const email = profile.emails?.[0]?.value;
    const username =
      profile.displayName || email?.split("@")[0] || `google-${profile.id}`;

    if (!email) {
      throw new ConflictException("Google profile did not contain an email");
    }

    let user = await this.prisma.user.findFirst({
      where: { googleId: profile.id },
    });

    if (!user) {
      user = await this.prisma.user.findFirst({
        where: { email },
      });
    }

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          username,
          email,
          provider: "google",
          googleId: profile.id,
        },
      });
    } else {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: profile.id,
          username: user.username || username,
        },
      });
    }

    return this.buildAuthResponse(user);
  }

  async refreshAccessToken(refreshToken: string) {
    const session = await this.prisma.session.findFirst({
      where: { refreshToken },
    });

    if (!session || new Date(session.expiresAt as Date) < new Date()) {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    const user = await this.prisma.user.findFirst({
      where: { id: session.userId },
    });
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshToken: this.generateRefreshToken(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      },
    });

    return this.buildAuthResponse(user, refreshToken);
  }

  private buildAuthResponse(
    user: {
      id: string;
      username: string;
      email: string;
      provider: string;
      googleId?: string | null;
    },
    newRefreshToken?: string,
  ) {
    const sanitizedUser = this.sanitizeUser(user);
    const accessToken = this.jwtService.sign({
      sub: sanitizedUser.id,
      email: sanitizedUser.email,
    });

    const refreshToken = newRefreshToken ?? this.generateRefreshToken();
    this.refreshTokens.set(refreshToken, {
      userId: sanitizedUser.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    });

    return {
      accessToken,
      refreshToken,
      user: sanitizedUser,
    };
  }

  private generateRefreshToken() {
    return `refresh-${createHash("sha256")
      .update(`${Date.now()}-${Math.random()}`)
      .digest("hex")}`;
  }

  private hashPassword(password: string) {
    return createHash("sha256").update(password).digest("hex");
  }

  private sanitizeUser(user: {
    passwordHash?: string | null;
    id: string;
    username: string;
    email: string;
    provider: string;
    googleId?: string | null;
  }) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...rest } = user;
    return rest;
  }
}
