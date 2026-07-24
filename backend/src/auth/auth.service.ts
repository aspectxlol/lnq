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

type UserRecord = {
  id: number;
  email: string;
  passwordHash?: string | null;
  firstName: string;
  lastName?: string | null;
  phone?: string | null;
  role: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async registerLocal(dto: RegisterAuthDto) {
    const existing = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
      },
    });

    if (existing) {
      throw new ConflictException("Email already exists");
    }

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash: this.hashPassword(dto.password),
        firstName: dto.firstName,
        lastName: dto.lastName ?? null,
        phone: dto.phone ?? null,
        role: "CUSTOMER",
      },
    });

    return this.buildAuthResponse(user);
  }

  async validateLocalUser(email: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        email,
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

  async loginLocal(email: string, password: string) {
    const user = await this.validateLocalUser(email, password);
    if (!user) {
      return null;
    }

    return this.buildAuthResponse(user as never);
  }

  async getAuthenticatedUser(id: string | number) {
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) {
      return null;
    }

    const user = await this.prisma.user.findFirst({ where: { id: numericId } });
    if (!user) {
      return null;
    }

    return this.sanitizeUser(user);
  }

  async handleGoogleAuth(profile: Profile) {
    const email = profile.emails?.[0]?.value;
    const firstName =
      profile.name?.givenName || profile.displayName?.split(" ")[0] || "Google";
    const lastName = profile.name?.familyName ?? null;

    if (!email) {
      throw new ConflictException("Google profile did not contain an email");
    }

    let user = await this.prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          emailVerified: true,
        },
      });
    } else {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          firstName: user.firstName || firstName,
          lastName: user.lastName ?? lastName,
          emailVerified: true,
        },
      });
    }

    return this.buildAuthResponse(user);
  }

  async refreshAccessToken(refreshToken: string) {
    const refreshTokenHash = this.hashPassword(refreshToken);
    const session = await this.prisma.session.findFirst({
      where: { refreshTokenHash },
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

    const rotatedRefreshToken = this.generateRefreshToken();
    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: this.hashPassword(rotatedRefreshToken),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      },
    });

    return this.buildAuthResponse(user, rotatedRefreshToken);
  }

  private async buildAuthResponse(user: UserRecord, newRefreshToken?: string) {
    const sanitizedUser = this.sanitizeUser(user);
    const accessToken = this.jwtService.sign({
      sub: sanitizedUser.id,
      email: sanitizedUser.email,
    });

    const refreshToken = newRefreshToken ?? this.generateRefreshToken();
    await this.persistRefreshToken(sanitizedUser.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      user: sanitizedUser,
    };
  }

  private async persistRefreshToken(userId: number, refreshToken: string) {
    await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash: this.hashPassword(refreshToken),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      },
    });
  }

  private generateRefreshToken() {
    return `refresh-${createHash("sha256")
      .update(`${Date.now()}-${Math.random()}`)
      .digest("hex")}`;
  }

  private hashPassword(password: string) {
    return createHash("sha256").update(password).digest("hex");
  }

  private sanitizeUser(user: UserRecord) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...rest } = user;
    return rest;
  }
}
