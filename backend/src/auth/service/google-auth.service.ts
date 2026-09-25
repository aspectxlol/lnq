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
import {
  AccountRepository,
  SessionRepository,
  UserRepository,
} from "../../repositories/auth";
import { GoogleIdentity } from "../interfaces/google.interface";
import { SafeUser } from "../interfaces/jwt.interface";
import { SessionService } from "./session.service";

@Injectable()
export class GoogleAuthService {
  private readonly logger: Logger = new Logger(GoogleAuthService.name);
  private readonly googleLinkStatePurpose = "LINK_GOOGLE";
  constructor(
    private readonly userRepository: UserRepository,
    private readonly accountRepository: AccountRepository,
    private readonly AccessJwtService: JwtService,
    private readonly SessionService: SessionService,
  ) {}
  async loginWithGoogle(
    googleUser: GoogleIdentity,
    req: FastifyRequest,
    res: FastifyReply,
  ): Promise<LoginResponse> {
    const account =
      await this.accountRepository.findProviderByAccountIdWithUser(
        "GOOGLE",
        googleUser.providerAccountId,
      );

    if (account) {
      const user = await this.userRepository.findById(account.accounts.userId);
      if (!user) {
        throw new UnauthorizedException("User not found");
      }
      if (!user.isActive) {
        throw new UnauthorizedException("User is inactive");
      }

      return this.SessionService.login(
        {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        req,
        res,
      );
    }

    const existingUser = await this.userRepository.findByEmail(
      googleUser.email,
    );

    if (existingUser) {
      throw new ConflictException(
        "An account with this email already exists. Please log in and link your Google account.",
      );
    }

    const newUser = await this.userRepository.create({
      name: googleUser.name,
      email: googleUser.email,
      passwordHash: undefined,
    });

    await this.accountRepository.create({
      provider: "GOOGLE",
      providerAccountId: googleUser.providerAccountId,
      userId: newUser.id,
    });

    return this.SessionService.login(
      {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
      },
      req,
      res,
    );
  }

  async linkGoogleAccount(
    user: SafeUser,
    googleUser: GoogleIdentity,
  ): Promise<void> {
    if (!user?.id) throw new UnauthorizedException("User not authenticated");

    const existingAccount =
      await this.accountRepository.findProviderByAccountIdWithUser(
        "GOOGLE",
        googleUser.providerAccountId,
      );

    if (existingAccount) {
      if (existingAccount.accounts.userId === user.id) {
        return;
      }

      throw new ConflictException(
        "This Google account is already linked to another user.",
      );
    }

    await this.accountRepository.create({
      provider: "GOOGLE",
      providerAccountId: googleUser.providerAccountId,
      userId: user.id,
    });
  }

  async handleGoogleCallback(
    googleUser: GoogleIdentity,
    state: string | undefined,
    req: FastifyRequest,
    res: FastifyReply,
  ): Promise<LoginResponse | { message: string }> {
    if (!state) {
      return this.loginWithGoogle(googleUser, req, res);
    }

    const targetUserId = this.verifyLinkState(state);
    const targetUser = await this.getSafeUserForLink(targetUserId);

    await this.linkGoogleAccount(targetUser, googleUser);

    return { message: "Google account linked" };
  }

  createGoogleLinkState(user: SafeUser): string {
    return this.AccessJwtService.sign(
      {
        sub: user.id,
        purpose: this.googleLinkStatePurpose,
        nonce: crypto.randomUUID(),
      },
      { expiresIn: "5m" },
    );
  }

  verifyLinkState(token: string): string {
    try {
      const payload = this.AccessJwtService.verify(token) as {
        sub?: string;
        purpose?: string;
      };

      if (!payload.sub || payload.purpose !== this.googleLinkStatePurpose) {
        throw new UnauthorizedException("Invalid link state");
      }

      return payload.sub;
    } catch (error) {
      this.logger.error("Google link state verification failed", error);
      throw new UnauthorizedException("Invalid link state");
    }
  }

  async getSafeUserForLink(userId: string): Promise<SafeUser> {
    const user = await this.userRepository.findById(userId);

    if (!user || !user.isActive) {
      throw new UnauthorizedException("Invalid user for linking");
    }

    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
