import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "../../auth/auth.service";
import { SessionRepository, UserRepository } from "../../repositories/auth";
import { JwtService } from "@nestjs/jwt";
import { RegisterInput } from "@lnq/shared";
import { FastifyReply, FastifyRequest } from "fastify";
import * as bcrypt from "bcrypt";
import * as RefreshJwt from "jsonwebtoken";
import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { AuthUser } from "../../auth/interfaces/auth-user.interface";
import { AccessJwtPayload } from "../../auth/interfaces/jwt.interface";
import { DAYSINSECONDS } from "../../utils";
import { Session, User } from "../../db/schema";
import { RowList } from "postgres";

jest.mock("bcrypt");
jest.mock("jsonwebtoken");

/**
 * ── A note on this file ──────────────────────────────────────────────
 * Tests tagged "[HARDENING]" assert the behavior a production auth
 * service *should* have, per security review, not necessarily what
 * auth.service.ts currently does. Several of these are expected to
 * FAIL against the current implementation - that's intentional. They
 * exist to:
 *   (a) document the target behavior precisely enough to implement against,
 *   (b) turn green the moment the corresponding fix lands, and
 *   (c) prevent the fix from silently regressing later.
 * Each [HARDENING] test names the gap it corresponds to. Do not "fix"
 * these tests to match current behavior - fix the service instead.
 * ────────────────────────────────────────────────────────────────────
 */

// ---- Shared fixtures -------------------------------------------------
// }

const session: Session = {
  id: "session-id",
  userId: "user-id",
  refreshTokenHash: "hashed-refresh-token",
  ipAddress: "127.0.0.1",
  userAgent: "test-agent",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastUsedAt: new Date(),
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  revokedAt: null,
};

const user: User = {
  id: "user-id",
  email: "test@example.com",
  passwordHash: "hashed-password",
  role: "CUSTOMER",
  name: "Test User",
  phone: null,
  phoneVerifiedAt: null,
  emailVerifiedAt: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("AuthService", () => {
  let service: AuthService;
  let userRepository: jest.Mocked<UserRepository>;
  let sessionRepository: jest.Mocked<SessionRepository>;
  let jwtService: jest.Mocked<JwtService>;

  const res = {
    setCookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as FastifyReply;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserRepository,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: SessionRepository,
          useValue: {
            create: jest.fn(),
            findByIdWithUser: jest.fn(),
            updateRevokedAt: jest.fn(),
            updateRefreshToken: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(UserRepository);
    sessionRepository = module.get(SessionRepository);
    jwtService = module.get(JwtService);

    jest.clearAllMocks();

    (res.setCookie as jest.Mock).mockReset();
    (res.clearCookie as jest.Mock).mockReset();

    (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-password");
    (RefreshJwt.sign as jest.Mock).mockReturnValue("refresh-token");
    jwtService.sign.mockReturnValue("access-token");

    process.env.JWT_REFRESH_SECRET = "test-secret";
  });

  describe("register", () => {
    const payload: RegisterInput = {
      email: "test@example.com",
      name: "Test User",
      password: "testpassword123",
    };

    const req = {
      ip: "127.0.0.1",
      headers: {
        "user-agent": "test-agent",
      },
    } as FastifyRequest;

    // const User = buildUser();
    const User: User = {
      id: "user-id",
      email: "test@example.com",
      passwordHash: "hashed-password",
      role: "CUSTOMER",
      name: "Test User",
      phone: null,
      phoneVerifiedAt: null,
      emailVerifiedAt: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(() => {
      jest.spyOn(service, "login").mockResolvedValue({
        access_token: "access-token",
        userid: "user-id",
      });
    });

    it("should create a new user", async () => {
      userRepository.findByEmail.mockResolvedValue(undefined);
      userRepository.create.mockResolvedValue(User);

      const result = await service.register(payload, req, res);

      expect(result).toEqual({
        access_token: "access-token",
        userid: "user-id",
      });

      expect(userRepository.findByEmail).toHaveBeenCalledWith(payload.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(payload.password, 10);
      expect(userRepository.create).toHaveBeenCalledWith({
        name: payload.name,
        email: payload.email,
        passwordHash: "hashed-password",
      });
    });

    it("should log in the newly created user", async () => {
      userRepository.findByEmail.mockResolvedValue(undefined);
      userRepository.create.mockResolvedValue(User);

      await service.register(payload, req, res);

      expect(service.login).toHaveBeenCalled();
    });

    it("should pass the created user to login", async () => {
      userRepository.findByEmail.mockResolvedValue(undefined);
      userRepository.create.mockResolvedValue(User);

      await service.register(payload, req, res);

      expect(service.login).toHaveBeenCalledWith(
        {
          id: User.id,
          email: User.email,
          role: User.role,
        },
        req,
        res,
      );
    });

    it("should throw a ConflictException if the email is already registered", async () => {
      userRepository.findByEmail.mockResolvedValue(User);

      await expect(service.register(payload, req, res)).rejects.toThrow(
        ConflictException,
      );

      expect(userRepository.create).not.toHaveBeenCalled();
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(service.login).not.toHaveBeenCalled();
    });

    it("should not hash the password if the email is already registered", async () => {
      userRepository.findByEmail.mockResolvedValue(User);

      await expect(service.register(payload, req, res)).rejects.toThrow(
        ConflictException,
      );

      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it("should not create a user if the email is already registered", async () => {
      userRepository.findByEmail.mockResolvedValue(User);

      await expect(service.register(payload, req, res)).rejects.toThrow(
        ConflictException,
      );

      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it("should not log the user in if the email is already registered", async () => {
      userRepository.findByEmail.mockResolvedValue(User);

      await expect(service.register(payload, req, res)).rejects.toThrow(
        ConflictException,
      );

      expect(service.login).not.toHaveBeenCalled();
    });

    it("should propagate the error if finding the user by email fails", async () => {
      const error = new Error("Database error");

      userRepository.findByEmail.mockRejectedValue(error);

      await expect(service.register(payload, req, res)).rejects.toThrow(
        "Database error",
      );

      expect(service.login).not.toHaveBeenCalled();
    });

    it("should propagate the error if password hashing fails", async () => {
      userRepository.findByEmail.mockResolvedValue(undefined);

      (bcrypt.hash as jest.Mock).mockRejectedValue(new Error("Hashing error"));

      await expect(service.register(payload, req, res)).rejects.toThrow(
        "Hashing error",
      );
    });

    it("should not create a user if password hashing fails", async () => {
      userRepository.findByEmail.mockResolvedValue(undefined);

      (bcrypt.hash as jest.Mock).mockRejectedValue(new Error("Hashing error"));

      await expect(service.register(payload, req, res)).rejects.toThrow();

      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it("should not log the user in if password hashing fails", async () => {
      userRepository.findByEmail.mockResolvedValue(undefined);

      (bcrypt.hash as jest.Mock).mockRejectedValue(new Error("Hashing error"));

      await expect(service.register(payload, req, res)).rejects.toThrow();

      expect(service.login).not.toHaveBeenCalled();
    });

    it("should propagate the error if user creation fails", async () => {
      userRepository.findByEmail.mockResolvedValue(undefined);

      userRepository.create.mockRejectedValue(new Error("User creation error"));

      await expect(service.register(payload, req, res)).rejects.toThrow(
        "User creation error",
      );

      expect(service.login).not.toHaveBeenCalled();
    });

    it("should not log the user in if user creation fails", async () => {
      userRepository.findByEmail.mockResolvedValue(undefined);

      userRepository.create.mockRejectedValue(new Error("User creation error"));

      await expect(service.register(payload, req, res)).rejects.toThrow();

      expect(service.login).not.toHaveBeenCalled();
    });

    it("should use the hashed password when creating the user", async () => {
      userRepository.findByEmail.mockResolvedValue(undefined);

      (bcrypt.hash as jest.Mock).mockResolvedValue("custom-hashed-password");

      userRepository.create.mockResolvedValue(User);

      await service.register(payload, req, res);

      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          passwordHash: "custom-hashed-password",
        }),
      );
    });

    it("should pass the correct user data when creating the user", async () => {
      userRepository.findByEmail.mockResolvedValue(undefined);
      userRepository.create.mockResolvedValue(User);

      await service.register(payload, req, res);

      expect(userRepository.create).toHaveBeenCalledWith({
        name: payload.name,
        email: payload.email,
        passwordHash: "hashed-password",
      });
    });

    it("should propagate the error if login fails", async () => {
      userRepository.findByEmail.mockResolvedValue(undefined);
      userRepository.create.mockResolvedValue(User);

      const error = new Error("Login error");

      jest.spyOn(service, "login").mockRejectedValue(error);

      await expect(service.register(payload, req, res)).rejects.toThrow(
        "Login error",
      );
    });
  });

  describe("login", () => {
    const authUser: AuthUser = {
      id: "user-id",
      email: "test@example.com",
      role: "CUSTOMER",
    };

    const req = {
      ip: "127.0.0.1",
      headers: {
        "user-agent": "test-agent",
      },
    } as FastifyRequest;

    beforeEach(() => {
      jest.spyOn(crypto, "randomUUID").mockReturnValue("a-a-a-a-a");

      (RefreshJwt.sign as jest.Mock).mockReturnValue("refresh-token");
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-refresh-token");
      jwtService.sign.mockReturnValue("access-token");

      sessionRepository.create.mockResolvedValue(session);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should create a session for the authenticated user", async () => {
      const result = await service.login(authUser, req, res);

      expect(result).toEqual({
        access_token: "access-token",
        userid: "user-id",
      });

      expect(sessionRepository.create).toHaveBeenCalledWith({
        userId: "user-id",
        sessionId: "a-a-a-a-a",
        refreshTokenHash: "hashed-refresh-token",
        ip: "127.0.0.1",
        userAgent: "test-agent",
      });
    });

    it("should generate a unique session id per login call", async () => {
      (crypto.randomUUID as jest.Mock)
        .mockReturnValueOnce("id-1")
        .mockReturnValueOnce("id-2");

      await service.login(authUser, req, res);
      await service.login(authUser, req, res);

      expect(sessionRepository.create).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ sessionId: "id-1" }),
      );
      expect(sessionRepository.create).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ sessionId: "id-2" }),
      );
    });

    it("should generate a refresh token", async () => {
      await service.login(authUser, req, res);

      expect(RefreshJwt.sign).toHaveBeenCalledWith(
        { sid: "a-a-a-a-a" },
        "test-secret",
        { expiresIn: "30d" },
      );
    });

    it("should hash the refresh token before storing it", async () => {
      await service.login(authUser, req, res);

      expect(bcrypt.hash).toHaveBeenCalledWith("refresh-token", 10);

      expect(sessionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          refreshTokenHash: "hashed-refresh-token",
        }),
      );
    });

    it("should never persist the raw refresh token, only its hash", async () => {
      await service.login(authUser, req, res);

      const createArgs = sessionRepository.create.mock.calls[0][0];
      expect(createArgs.refreshTokenHash).not.toBe("refresh-token");
    });

    it("should use the authenticated user's ID when creating the session", async () => {
      await service.login(authUser, req, res);

      expect(sessionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-id",
        }),
      );
    });

    it("should use the request IP when creating the session", async () => {
      const customReq = {
        ip: "192.168.1.50",
        headers: {
          "user-agent": "test-agent",
        },
      } as FastifyRequest;

      await service.login(authUser, customReq, res);

      expect(sessionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ip: "192.168.1.50",
        }),
      );
    });

    it("should use the user-agent when creating the session", async () => {
      const customReq = {
        ip: "127.0.0.1",
        headers: {
          "user-agent": "Custom-Agent",
        },
      } as FastifyRequest;

      await service.login(authUser, customReq, res);

      expect(sessionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userAgent: "Custom-Agent",
        }),
      );
    });

    it("should use 'Unknown' when the user-agent is missing", async () => {
      const customReq = {
        ip: "127.0.0.1",
        headers: {},
      } as FastifyRequest;

      await service.login(authUser, customReq, res);

      expect(sessionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userAgent: "Unknown",
        }),
      );
    });

    it("should generate an access token containing the authenticated user", async () => {
      await service.login(authUser, req, res);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: "user-id",
        email: "test@example.com",
        role: "CUSTOMER",
        sessionId: "a-a-a-a-a",
      });
    });

    it("should not embed the password hash in the access token payload", async () => {
      await service.login(authUser, req, res);

      const payload = jwtService.sign.mock.calls[0][0];
      expect(payload).not.toHaveProperty("passwordHash");
    });

    it("should set the refresh token cookie", async () => {
      await service.login(authUser, req, res);

      expect(res.setCookie).toHaveBeenCalledWith(
        "refresh_token",
        "refresh-token",
        expect.objectContaining({
          httpOnly: true,
          sameSite: "lax",
          path: "/auth/refresh",
          maxAge: 30 * DAYSINSECONDS,
        }),
      );
    });

    it("should mark the cookie secure only in production", async () => {
      const originalEnv = process.env.NODE_ENV;

      process.env.NODE_ENV = "production";
      await service.login(authUser, req, res);
      expect(res.setCookie).toHaveBeenLastCalledWith(
        "refresh_token",
        expect.any(String),
        expect.objectContaining({ secure: true }),
      );

      (res.setCookie as jest.Mock).mockClear();

      process.env.NODE_ENV = "development";
      await service.login(authUser, req, res);
      expect(res.setCookie).toHaveBeenLastCalledWith(
        "refresh_token",
        expect.any(String),
        expect.objectContaining({ secure: false }),
      );

      process.env.NODE_ENV = originalEnv;
    });

    it("should scope the refresh cookie to the /auth/refresh path only", async () => {
      await service.login(authUser, req, res);

      expect(res.setCookie).toHaveBeenCalledWith(
        "refresh_token",
        expect.any(String),
        expect.objectContaining({ path: "/auth/refresh" }),
      );
    });

    it("should return the access token and user ID", async () => {
      const result = await service.login(authUser, req, res);

      expect(result).toEqual({
        access_token: "access-token",
        userid: "user-id",
      });
    });

    it("should propagate the error if session creation fails", async () => {
      sessionRepository.create.mockRejectedValue(
        new Error("Session creation error"),
      );

      await expect(service.login(authUser, req, res)).rejects.toThrow(
        "Session creation error",
      );

      expect(jwtService.sign).not.toHaveBeenCalled();
      expect(res.setCookie).not.toHaveBeenCalled();
    });

    it("should propagate the error if refresh token hashing fails", async () => {
      (bcrypt.hash as jest.Mock).mockRejectedValue(new Error("Hashing error"));

      await expect(service.login(authUser, req, res)).rejects.toThrow(
        "Hashing error",
      );

      expect(sessionRepository.create).not.toHaveBeenCalled();
      expect(jwtService.sign).not.toHaveBeenCalled();
      expect(res.setCookie).not.toHaveBeenCalled();
    });

    it("should propagate the error if access token generation fails", async () => {
      jwtService.sign.mockImplementationOnce(() => {
        throw new Error("Access token error");
      });

      await expect(service.login(authUser, req, res)).rejects.toThrow(
        "Access token error",
      );
    });

    it("should propagate the error if setting the refresh cookie fails", async () => {
      (res.setCookie as jest.Mock).mockImplementationOnce(() => {
        throw new Error("Cookie error");
      });

      await expect(service.login(authUser, req, res)).rejects.toThrow(
        "Cookie error",
      );
    });
  });

  describe("refresh", () => {
    const req = {
      cookies: { refresh_token: "valid-refresh-token" },
    } as unknown as FastifyRequest;

    beforeEach(() => {
      (RefreshJwt.verify as jest.Mock).mockReturnValue({ sid: "session-id" });

      sessionRepository.findByIdWithUser.mockResolvedValue({
        session,
        user,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (RefreshJwt.sign as jest.Mock).mockReturnValue("new-refresh-token");
      (bcrypt.hash as jest.Mock).mockResolvedValue("new-hashed-refresh-token");
      sessionRepository.updateRefreshToken.mockResolvedValue({
        ...session,
        refreshTokenHash: "new-hashed-refresh-token",
      });
      sessionRepository.updateRevokedAt.mockResolvedValue([
        { ...session, revokedAt: new Date() },
      ]);
      jwtService.sign.mockReturnValue("new-access-token");
    });

    it("should successfully rotate tokens and set a new refresh cookie when given a valid token", async () => {
      await service.refresh(req, res);

      expect(RefreshJwt.sign).toHaveBeenCalledWith(
        { sid: "session-id" },
        "test-secret",
        { expiresIn: "30d" },
      );

      expect(sessionRepository.updateRefreshToken).toHaveBeenCalledWith(
        "session-id",
        "new-hashed-refresh-token",
      );

      expect(res.setCookie).toHaveBeenCalledWith(
        "refresh_token",
        "new-refresh-token",
        expect.objectContaining({
          httpOnly: true,
          sameSite: "lax",
          path: "/auth/refresh",
          maxAge: 30 * DAYSINSECONDS,
        }),
      );
    });

    it("should issue a new refresh token distinct from the one presented", async () => {
      await service.refresh(req, res);

      const [, newToken] = (res.setCookie as jest.Mock).mock.calls[0];
      expect(newToken).not.toBe("valid-refresh-token");
    });

    it("should never persist the raw rotated refresh token, only its hash", async () => {
      await service.refresh(req, res);

      const [, hashArg] = sessionRepository.updateRefreshToken.mock.calls[0];
      expect(hashArg).not.toBe("new-refresh-token");
    });

    it("should use identical cookie security options for the rotated cookie as for the initial login cookie", async () => {
      const loginReq = {
        ip: "127.0.0.1",
        headers: { "user-agent": "test-agent" },
      } as FastifyRequest;
      sessionRepository.create.mockResolvedValue(session);

      await service.login(
        { id: "user-id", email: "test@example.com", role: "CUSTOMER" },
        loginReq,
        res,
      );
      const loginOptions = (res.setCookie as jest.Mock).mock.calls[0][2];

      (res.setCookie as jest.Mock).mockClear();

      await service.refresh(req, res);
      const refreshOptions = (res.setCookie as jest.Mock).mock.calls[0][2];

      expect(refreshOptions).toEqual(loginOptions);
    });

    it("should return a newly signed access token on successful refresh", async () => {
      const result = await service.refresh(req, res);

      expect(result).toEqual({ access_token: "new-access-token" });
    });

    it("should throw UnauthorizedException if the refresh_token cookie is missing", async () => {
      const emptyReq = { cookies: {} } as unknown as FastifyRequest;

      await expect(service.refresh(emptyReq, res)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(RefreshJwt.verify).not.toHaveBeenCalled();
      expect(sessionRepository.findByIdWithUser).not.toHaveBeenCalled();
    });

    it("should throw UnauthorizedException if refresh_token cookie is an empty string", async () => {
      const emptyReq = {
        cookies: { refresh_token: "" },
      } as unknown as FastifyRequest;

      await expect(service.refresh(emptyReq, res)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw UnauthorizedException if the refresh token signature verification fails", async () => {
      (RefreshJwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error("invalid signature");
      });

      await expect(service.refresh(req, res)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(sessionRepository.findByIdWithUser).not.toHaveBeenCalled();
    });

    it("should throw UnauthorizedException if the refresh token has expired (jwt.verify TokenExpiredError)", async () => {
      (RefreshJwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error("jwt expired");
      });

      await expect(service.refresh(req, res)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw UnauthorizedException if the session does not exist in the database", async () => {
      sessionRepository.findByIdWithUser.mockResolvedValue(undefined);

      await expect(service.refresh(req, res)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it("should throw UnauthorizedException if the session has been revoked", async () => {
      sessionRepository.findByIdWithUser.mockResolvedValue({
        session: { ...session, revokedAt: new Date() },
        user,
      });

      await expect(service.refresh(req, res)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it("should throw UnauthorizedException if the session has expired", async () => {
      sessionRepository.findByIdWithUser.mockResolvedValue({
        session: { ...session, expiresAt: new Date(Date.now() - 1000) },
        user,
      });

      await expect(service.refresh(req, res)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it("should throw UnauthorizedException if the session's expiresAt is in the past by even a millisecond", async () => {
      sessionRepository.findByIdWithUser.mockResolvedValue({
        session: { ...session, expiresAt: new Date(Date.now() - 1) },
        user,
      });

      await expect(service.refresh(req, res)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw UnauthorizedException if the associated user account is inactive", async () => {
      sessionRepository.findByIdWithUser.mockResolvedValue({
        session,
        user: { ...user, isActive: false },
      });

      await expect(service.refresh(req, res)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it("should throw UnauthorizedException if the user record on the session is missing", async () => {
      sessionRepository.findByIdWithUser.mockResolvedValue({
        session,
        user: undefined as unknown as User,
      });

      await expect(service.refresh(req, res)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw UnauthorizedException if the stored bcrypt refresh token hash does not match", async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.refresh(req, res)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(sessionRepository.updateRefreshToken).not.toHaveBeenCalled();
      expect(res.setCookie).not.toHaveBeenCalled();
    });

    it("should compare the presented token against the session's stored hash, not a fresh hash", async () => {
      await service.refresh(req, res);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        "valid-refresh-token",
        "hashed-refresh-token",
      );
    });

    it("should propagate errors if database token rotation fails", async () => {
      sessionRepository.updateRefreshToken.mockRejectedValue(
        new Error("Database error"),
      );

      await expect(service.refresh(req, res)).rejects.toThrow("Database error");

      expect(res.setCookie).not.toHaveBeenCalled();
    });

    it("should propagate the error if setting the rotated cookie fails after the DB write", async () => {
      (res.setCookie as jest.Mock).mockImplementationOnce(() => {
        throw new Error("Cookie error");
      });

      await expect(service.refresh(req, res)).rejects.toThrow("Cookie error");
    });

    // ── [HARDENING] Refresh token reuse / theft detection ──────────────
    // Gap: today a mismatched refresh token just returns a generic 401.
    // If an attacker steals and uses a refresh token before the real user
    // does, the real user's *next* refresh attempt (with the now-stale
    // token) looks identical to garbage input to the current code - there
    // is no signal that the session may be compromised, and the session
    // stays alive for the attacker. A production implementation should
    // revoke the session outright on a hash mismatch, forcing full
    // re-authentication, rather than just rejecting the one request.
    it("should revoke the session when the presented refresh token does not match the stored hash", async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.refresh(req, res)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(sessionRepository.updateRevokedAt).toHaveBeenCalledWith(
        "session-id",
      );
    });

    it("should invalidate the session so a stale-but-previously-valid token cannot be retried after a mismatch", async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
      await expect(service.refresh(req, res)).rejects.toThrow(
        UnauthorizedException,
      );

      // Simulate the attacker (or the legitimate client with a stale
      // token) retrying immediately after. The session should now be
      // revoked in the DB, so a subsequent lookup reflects that - we
      // assert the revoke call happened with the right session, since
      // the mock repository won't enforce this by itself.
      expect(sessionRepository.updateRevokedAt).toHaveBeenCalledTimes(1);
      expect(sessionRepository.updateRevokedAt).toHaveBeenCalledWith(
        "session-id",
      );
    });

    it("should NOT revoke the session for unrelated refresh failures (missing cookie, bad signature, expired session)", async () => {
      // Revocation-on-mismatch should be specific to a hash mismatch on
      // an otherwise-valid session, not a blanket "any failure revokes."
      sessionRepository.findByIdWithUser.mockResolvedValue({
        session: { ...session, expiresAt: new Date(Date.now() - 1000) },
        user,
      });

      await expect(service.refresh(req, res)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(sessionRepository.updateRevokedAt).not.toHaveBeenCalled();
    });

    // // ── [HARDENING] Session ID rotation ─────────────────────────────────
    // // Gap: only the refresh token is rotated; the session id issued at
    // // login is reused for the lifetime of the session. If a session id
    // // ever leaks (logs, error traces, DB access) it stays valid until
    // // natural expiry or explicit logout regardless of token rotation.
    // // A production implementation should mint a new session id on every
    // // refresh and retire the old one.
    // it("should issue an access token bound to a new session id, not the one that was presented", async () => {
    //   await service.refresh(req, res);

    //   const signedPayload = jwtService.sign.mock.calls[0][0] as Record<
    //     string,
    //     unknown
    //   >;
    //   expect(signedPayload.sessionId).not.toBe("session-id");
    // });

    // it("should retire the old session id so it can no longer be used to refresh", async () => {
    //   await service.refresh(req, res);

    //   // Old session id should be revoked, not merely have its token
    //   // rotated in place.
    //   expect(sessionRepository.updateRevokedAt).toHaveBeenCalledWith(
    //     "session-id",
    //   );
    // });
  });

  describe("logout", () => {
    const req = {
      cookies: { refresh_token: "valid-refresh-token" },
    } as unknown as FastifyRequest;

    beforeEach(() => {
      (RefreshJwt.verify as jest.Mock).mockReturnValue({ sid: "session-id" });
      sessionRepository.updateRevokedAt.mockResolvedValue([
        { ...session, revokedAt: new Date() },
      ]);
    });

    it("should revoke the active session in the database by updating revokedAt", async () => {
      await service.logout(req, res);

      expect(sessionRepository.updateRevokedAt).toHaveBeenCalledWith(
        "session-id",
      );
    });

    it("should clear the refresh_token cookie with matching path and security flags", async () => {
      await service.logout(req, res);

      expect(res.clearCookie).toHaveBeenCalledWith(
        "refresh_token",
        expect.objectContaining({
          httpOnly: true,
          sameSite: "lax",
          path: "/auth/refresh",
        }),
      );
    });

    it("should mark the cleared cookie secure only in production", async () => {
      const originalEnv = process.env.NODE_ENV;

      process.env.NODE_ENV = "production";
      await service.logout(req, res);
      expect(res.clearCookie).toHaveBeenLastCalledWith(
        "refresh_token",
        expect.objectContaining({ secure: true }),
      );

      process.env.NODE_ENV = originalEnv;
    });

    it("should return a success message and ISO timestamp upon logging out", async () => {
      const result = await service.logout(req, res);

      expect(result.message).toBe("Logged out successfully");
      expect(result.timestamp).toBe(new Date(result.timestamp).toISOString());
    });

    it("should not revoke any session if the refresh_token cookie is missing", async () => {
      const emptyReq = { cookies: {} } as unknown as FastifyRequest;

      await expect(service.logout(emptyReq, res)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(sessionRepository.updateRevokedAt).not.toHaveBeenCalled();
      expect(res.clearCookie).not.toHaveBeenCalled();
    });

    it("should throw UnauthorizedException if the refresh token signature is invalid", async () => {
      (RefreshJwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error("invalid signature");
      });

      await expect(service.logout(req, res)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(sessionRepository.updateRevokedAt).not.toHaveBeenCalled();
    });

    it("should propagate database errors if updating revokedAt fails", async () => {
      sessionRepository.updateRevokedAt.mockRejectedValue(
        new Error("Database error"),
      );

      await expect(service.logout(req, res)).rejects.toThrow("Database error");

      expect(res.clearCookie).not.toHaveBeenCalled();
    });
  });

  describe("me", () => {
    // const dbUser = buildUser({
    // });

    const dbUser = {
      ...user,
      phone: "+10000000000",
      emailVerifiedAt: new Date(),
    };

    const authUser: AuthUser = {
      id: "user-id",
      email: "test@example.com",
      role: "CUSTOMER",
    };

    it("should return the public user profile data for a valid user ID", async () => {
      userRepository.findById.mockResolvedValue(dbUser);

      const result = await service.me(authUser);

      expect(userRepository.findById).toHaveBeenCalledWith("user-id");
      expect(result).toEqual({
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
      });
    });

    it("should not expose the passwordHash in the returned profile response", async () => {
      userRepository.findById.mockResolvedValue(dbUser);

      const result = await service.me(authUser);

      expect(result).not.toHaveProperty("passwordHash");
    });

    it("should look up the user by the ID on the authenticated principal, not by email", async () => {
      userRepository.findById.mockResolvedValue(dbUser);

      await service.me(authUser);

      expect(userRepository.findById).toHaveBeenCalledWith(authUser.id);
      expect(userRepository.findByEmail).not.toHaveBeenCalled();
    });

    it("should throw UnauthorizedException if the user is not found in the database", async () => {
      userRepository.findById.mockResolvedValue(undefined);

      await expect(service.me(authUser)).rejects.toThrow(UnauthorizedException);
    });

    it("should propagate database errors if fetching the user fails", async () => {
      userRepository.findById.mockRejectedValue(new Error("Database error"));

      await expect(service.me(authUser)).rejects.toThrow("Database error");
    });

    // ── [HARDENING] me() must enforce isActive independently ───────────
    // Gap: me() currently trusts that validateSession() already screened
    // out deactivated users upstream in the guard chain, and does not
    // check isActive itself. That's an implicit, unenforced dependency -
    // if me() is ever reachable through another path (a new controller,
    // a service-to-service call, a future refactor of the guard order),
    // a deactivated user's profile is returned with no error. Defense in
    // depth says this check belongs in the service, not just the guard.
    it("[HARDENING] should throw UnauthorizedException for a deactivated user, independent of any upstream guard", async () => {
      userRepository.findById.mockResolvedValue({
        ...user,
        isActive: false,
      });

      await expect(service.me(authUser)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("validateSession", () => {
    const payload: AccessJwtPayload = {
      sub: "user-id",
      email: "test@example.com",
      role: "CUSTOMER",
      sessionId: "session-id",
    };

    it("should return the user object stripped of passwordHash when the session is valid", async () => {
      sessionRepository.findByIdWithUser.mockResolvedValue({
        session,
        user,
      });

      const result = await service.validateSession(payload);

      expect(sessionRepository.findByIdWithUser).toHaveBeenCalledWith(
        "session-id",
      );
      expect(result).not.toHaveProperty("passwordHash");
      expect(result).toEqual({
        id: "user-id",
        email: "test@example.com",
        role: "CUSTOMER",
        name: "Test User",
        phone: null,
        phoneVerifiedAt: null,
        emailVerifiedAt: null,
        isActive: true,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it("should look up the session by the sessionId in the token, not the sub", async () => {
      sessionRepository.findByIdWithUser.mockResolvedValue({
        session,
        user,
      });

      await service.validateSession(payload);

      expect(sessionRepository.findByIdWithUser).toHaveBeenCalledWith(
        payload.sessionId,
      );
      expect(sessionRepository.findByIdWithUser).not.toHaveBeenCalledWith(
        payload.sub,
      );
    });

    it("should throw UnauthorizedException if the session subject ID does not match the token payload sub", async () => {
      sessionRepository.findByIdWithUser.mockResolvedValue({
        session,
        user: { ...user, id: "different-user-id" },
      });

      await expect(service.validateSession(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw UnauthorizedException if no session is found", async () => {
      sessionRepository.findByIdWithUser.mockResolvedValue(undefined);

      await expect(service.validateSession(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw UnauthorizedException if the session has expired", async () => {
      sessionRepository.findByIdWithUser.mockResolvedValue({
        session: { ...session, expiresAt: new Date(Date.now() - 1000) },
        user,
      });

      await expect(service.validateSession(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw UnauthorizedException if the session has been revoked", async () => {
      sessionRepository.findByIdWithUser.mockResolvedValue({
        session: { ...session, revokedAt: new Date() },
        user,
      });

      await expect(service.validateSession(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw UnauthorizedException if the user attached to the session is inactive", async () => {
      sessionRepository.findByIdWithUser.mockResolvedValue({
        session,
        user: { ...user, isActive: false },
      });

      await expect(service.validateSession(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should propagate database errors if the session lookup fails", async () => {
      sessionRepository.findByIdWithUser.mockRejectedValue(
        new Error("Database error"),
      );

      await expect(service.validateSession(payload)).rejects.toThrow(
        "Database error",
      );
    });
  });

  describe("validateUser", () => {
    it("should return an AuthUser when credentials are valid", async () => {
      userRepository.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser("test@example.com", "password");

      expect(result).toEqual({
        id: "user-id",
        email: "test@example.com",
        role: "CUSTOMER",
      });
    });

    it("should return null if the user does not exist", async () => {
      userRepository.findByEmail.mockResolvedValue(undefined);

      const result = await service.validateUser("test@example.com", "password");

      expect(result).toBeNull();
    });

    it("should return null if the password is incorrect", async () => {
      userRepository.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser(
        "test@example.com",
        "wrong-password",
      );

      expect(result).toBeNull();
    });

    it("should compare the provided password against the stored hash", async () => {
      userRepository.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await service.validateUser("test@example.com", "password");

      expect(bcrypt.compare).toHaveBeenCalledWith(
        "password",
        "hashed-password",
      );
    });

    it("should not expose the password hash", async () => {
      userRepository.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser("test@example.com", "password");

      expect(result).not.toHaveProperty("passwordHash");
    });

    it("should propagate repository errors", async () => {
      userRepository.findByEmail.mockRejectedValue(new Error("Database error"));

      await expect(
        service.validateUser("test@example.com", "password"),
      ).rejects.toThrow("Database error");
    });

    // ── [HARDENING] Timing-safe user enumeration resistance ────────────
    // Gap: validateUser() returns null immediately when the email isn't
    // found, without ever calling bcrypt.compare. Since bcrypt.compare is
    // deliberately slow (~10 rounds), a "no such user" response is
    // measurably faster than a "wrong password" response. Given enough
    // samples, that timing gap is enough to enumerate registered emails
    // against the login endpoint. Production implementations run a dummy
    // compare against a static hash on the not-found path so both cases
    // take the same time.
    it("should call bcrypt.compare even when the user does not exist", async () => {
      userRepository.findByEmail.mockResolvedValue(undefined);

      await service.validateUser("nobody@example.com", "password");

      expect(bcrypt.compare).toHaveBeenCalled();
    });

    it("should still return null for a nonexistent user even if the dummy compare somehow resolves true", async () => {
      userRepository.findByEmail.mockResolvedValue(undefined);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(
        "nobody@example.com",
        "password",
      );

      expect(result).toBeNull();
    });

    // ── [HARDENING] isActive enforced at the credential-validation layer ─
    // Gap: validateUser() has no isActive check of its own; a deactivated
    // account with correct credentials still resolves to an AuthUser.
    // Whatever calls validateUser() (e.g. a Passport LocalStrategy) is
    // trusted to reject it downstream today. Enforcing isActive here too
    // means a deactivated account can never authenticate via this path
    // regardless of what calls it.
    it("should return null for a deactivated user even with correct credentials", async () => {
      userRepository.findByEmail.mockResolvedValue(
        // buildUser({ isActive: false }),
        { ...user, isActive: false },
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser("test@example.com", "password");

      expect(result).toBeNull();
    });
  });
});
