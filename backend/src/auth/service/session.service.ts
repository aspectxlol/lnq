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
import { AuthService } from "../auth.service";
import {
  AccountRepository,
  SessionRepository,
  UserRepository,
} from "../../repositories/auth";
import { DAYSINSECONDS } from "../../utils";
import { AuthUser } from "../interfaces/auth-user.interface";
import {
  AccessJwtPayload,
  RefreshJwtPayload,
  SafeUser,
} from "../interfaces/jwt.interface";

@Injectable()
export class SessionService {
  private readonly RefreshJwt = RefreshJwt;
  private readonly logger: Logger = new Logger(SessionService.name);
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly AccessJwtService: JwtService,
  ) {}

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
      path: "/auth",
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

    await this.rotateRefreshToken(sessionId, session.refreshTokenHash, reply);

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
      path: "/auth",
    });

    return {
      message: "Logged out successfully",
      timestamp: new Date().toISOString(),
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

  private async verifyRefreshToken(
    refreshToken: string,
  ): Promise<RefreshJwtPayload> {
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
    previousRefreshTokenHash: string,
    reply: FastifyReply,
  ): Promise<void> {
    const newRefreshToken = this.RefreshJwt.sign(
      { sid: sessionId },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "30d" },
    ); // Generate a new unique refresh token

    const hashedNewRefreshToken = await bcrypt.hash(newRefreshToken, 10); // Hash the new refresh token
    const updatedSession = await this.sessionRepository.updateRefreshToken(
      sessionId,
      previousRefreshTokenHash,
      hashedNewRefreshToken,
    );

    if (!updatedSession) {
      throw new UnauthorizedException(
        "Refresh token was already rotated; please authenticate again",
      );
    }

    reply.setCookie("refresh_token", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/auth",
      maxAge: 30 * DAYSINSECONDS, // 30 days in seconds
    });
  }
}
