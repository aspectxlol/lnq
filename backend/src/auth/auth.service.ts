import { ConflictException, Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterAuthDto } from './dto/register-auth.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async registerLocal(dto: RegisterAuthDto) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: dto.username }, { email: dto.email }],
      },
    });

    if (existing) {
      throw new ConflictException('Username or email already exists');
    }

    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        passwordHash: this.hashPassword(dto.password),
        provider: 'local',
      },
    });

    return this.sanitizeUser(user);
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

  async handleGoogleAuth(profile: any) {
    const email = profile.emails?.[0]?.value;
    const username =
      profile.displayName || email?.split('@')[0] || `google-${profile.id}`;

    if (!email) {
      throw new ConflictException('Google profile did not contain an email');
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
          provider: 'google',
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

    return this.sanitizeUser(user);
  }

  private hashPassword(password: string) {
    return createHash('sha256').update(password).digest('hex');
  }

  private sanitizeUser(user: { passwordHash?: string | null; id: string; username: string; email: string; provider: string; googleId?: string | null }) {
    const { passwordHash, ...rest } = user;
    return rest;
  }
}
