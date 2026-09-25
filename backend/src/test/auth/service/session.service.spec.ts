import { Test, TestingModule } from "@nestjs/testing";
import { UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { FastifyReply, FastifyRequest } from "fastify";
import * as bcrypt from "bcrypt";
import * as RefreshJwt from "jsonwebtoken";

import { SessionService } from "../../../auth/service/session.service";
import { SessionRepository } from "../../../repositories/auth";

jest.mock("bcrypt");
jest.mock("jsonwebtoken");

describe("SessionService", () => {
  let service: SessionService;
  let sessionRepository: {
    create: jest.Mock;
    findByIdWithUser: jest.Mock;
    updateRevokedAt: jest.Mock;
    updateRefreshToken: jest.Mock;
  };
  let accessJwtService: { sign: jest.Mock };

  const session = {
    id: "session-id",
    userId: "user-id",
    refreshTokenHash: "hashed-refresh-token",
    revokedAt: null,
    expiresAt: new Date(Date.now() + 60_000),
  };
  const user = {
    id: "user-id",
    email: "test@example.com",
    role: "CUSTOMER" as const,
    isActive: true,
  };
  const reply = {
    setCookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as FastifyReply;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        {
          provide: SessionRepository,
          useValue: {
            create: jest.fn(),
            findByIdWithUser: jest.fn(),
            updateRevokedAt: jest.fn(),
            updateRefreshToken: jest.fn(),
          },
        },
        { provide: JwtService, useValue: { sign: jest.fn() } },
      ],
    }).compile();

    service = module.get(SessionService);
    sessionRepository = module.get(SessionRepository);
    accessJwtService = module.get(JwtService);
    jest.resetAllMocks();
    jest
      .spyOn(crypto, "randomUUID")
      .mockReturnValue("aaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    (RefreshJwt.sign as jest.Mock).mockReturnValue("refresh-token");
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-refresh-token");
    accessJwtService.sign.mockReturnValue("access-token");
  });

  afterEach(() => jest.restoreAllMocks());

  it("should create a session and return an access token", async () => {
    const request = {
      ip: "127.0.0.1",
      headers: { "user-agent": "test-agent" },
    } as FastifyRequest;

    await expect(service.login({ ...user }, request, reply)).resolves.toEqual({
      access_token: "access-token",
      userid: user.id,
    });
    expect(sessionRepository.create).toHaveBeenCalledWith({
      sessionId: "aaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      userId: user.id,
      refreshTokenHash: "hashed-refresh-token",
      ip: request.ip,
      userAgent: "test-agent",
    });
    expect(reply.setCookie).toHaveBeenCalledWith(
      "refresh_token",
      "refresh-token",
      expect.objectContaining({ path: "/auth" }),
    );
  });

  it("should generate a refresh token and hash it before storing the session", async () => {
    const request = {
      ip: "127.0.0.1",
      headers: { "user-agent": "test-agent" },
    } as FastifyRequest;

    await service.login({ ...user }, request, reply);

    expect(RefreshJwt.sign).toHaveBeenCalledWith(
      { sid: "aaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee" },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "30d" },
    );
    expect(bcrypt.hash).toHaveBeenCalledWith("refresh-token", 10);
    expect(sessionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ refreshTokenHash: "hashed-refresh-token" }),
    );
  });

  it("should use Unknown when the request has no user-agent", async () => {
    const request = {
      ip: "127.0.0.1",
      headers: {},
    } as FastifyRequest;

    await service.login({ ...user }, request, reply);

    expect(sessionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ userAgent: "Unknown" }),
    );
  });

  it("should include the authenticated user in the access token payload", async () => {
    const request = {
      ip: "127.0.0.1",
      headers: { "user-agent": "test-agent" },
    } as FastifyRequest;

    await service.login({ ...user }, request, reply);

    expect(accessJwtService.sign).toHaveBeenCalledWith({
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionId: "aaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    });
  });

  it("should not include a password hash in the access token payload", async () => {
    const request = {
      ip: "127.0.0.1",
      headers: { "user-agent": "test-agent" },
    } as FastifyRequest;

    await service.login(
      { ...user, passwordHash: "secret" } as never,
      request,
      reply,
    );

    expect(accessJwtService.sign.mock.calls[0][0]).not.toHaveProperty(
      "passwordHash",
    );
  });

  it("should mark the refresh cookie secure only in production", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    await service.login(
      { ...user },
      { ip: "127.0.0.1", headers: {} } as FastifyRequest,
      reply,
    );

    expect(reply.setCookie).toHaveBeenCalledWith(
      "refresh_token",
      "refresh-token",
      expect.objectContaining({ secure: true }),
    );
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("should propagate a session repository creation error", async () => {
    sessionRepository.create.mockRejectedValue(new Error("Database error"));

    await expect(
      service.login(
        { ...user },
        { ip: "127.0.0.1", headers: {} } as FastifyRequest,
        reply,
      ),
    ).rejects.toThrow("Database error");
    expect(reply.setCookie).not.toHaveBeenCalled();
  });

  it("should propagate a refresh token hashing error", async () => {
    (bcrypt.hash as jest.Mock).mockRejectedValue(new Error("Hash error"));

    await expect(
      service.login(
        { ...user },
        { ip: "127.0.0.1", headers: {} } as FastifyRequest,
        reply,
      ),
    ).rejects.toThrow("Hash error");
    expect(sessionRepository.create).not.toHaveBeenCalled();
  });

  it("should propagate an access token signing error", async () => {
    accessJwtService.sign.mockImplementation(() => {
      throw new Error("Signing error");
    });

    await expect(
      service.login(
        { ...user },
        { ip: "127.0.0.1", headers: {} } as FastifyRequest,
        reply,
      ),
    ).rejects.toThrow("Signing error");
    expect(reply.setCookie).toHaveBeenCalledWith(
      "refresh_token",
      "refresh-token",
      expect.any(Object),
    );
  });

  it("should propagate a refresh cookie error", async () => {
    (reply.setCookie as jest.Mock).mockImplementation(() => {
      throw new Error("Cookie error");
    });

    await expect(
      service.login(
        { ...user },
        { ip: "127.0.0.1", headers: {} } as FastifyRequest,
        reply,
      ),
    ).rejects.toThrow("Cookie error");
  });

  it("should reject refresh when the cookie is missing", async () => {
    await expect(
      service.refresh({ cookies: {} } as unknown as FastifyRequest, reply),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("should reject refresh when the cookie is empty", async () => {
    await expect(
      service.refresh(
        { cookies: { refresh_token: "" } } as unknown as FastifyRequest,
        reply,
      ),
    ).rejects.toThrow(UnauthorizedException);
    expect(RefreshJwt.verify).not.toHaveBeenCalled();
  });

  it("should reject refresh when the token signature is invalid", async () => {
    (RefreshJwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    await expect(
      service.refresh(
        {
          cookies: { refresh_token: "refresh-token" },
        } as unknown as FastifyRequest,
        reply,
      ),
    ).rejects.toThrow(UnauthorizedException);
    expect(sessionRepository.findByIdWithUser).not.toHaveBeenCalled();
  });

  it("should reject refresh when the session does not exist", async () => {
    (RefreshJwt.verify as jest.Mock).mockReturnValue({ sid: "session-id" });
    sessionRepository.findByIdWithUser.mockResolvedValue(undefined);

    await expect(
      service.refresh(
        {
          cookies: { refresh_token: "refresh-token" },
        } as unknown as FastifyRequest,
        reply,
      ),
    ).rejects.toThrow(UnauthorizedException);
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  it.each([
    ["revoked", { ...session, revokedAt: new Date() }, user],
    ["expired", { ...session, expiresAt: new Date(Date.now() - 1) }, user],
    ["inactive", session, { ...user, isActive: false }],
  ])(
    "should reject refresh for a %s session or user",
    async (_reason, currentSession, currentUser) => {
      (RefreshJwt.verify as jest.Mock).mockReturnValue({ sid: "session-id" });
      sessionRepository.findByIdWithUser.mockResolvedValue({
        session: currentSession,
        user: currentUser,
      });

      await expect(
        service.refresh(
          {
            cookies: { refresh_token: "refresh-token" },
          } as unknown as FastifyRequest,
          reply,
        ),
      ).rejects.toThrow(UnauthorizedException);
      expect(bcrypt.compare).not.toHaveBeenCalled();
    },
  );

  it("should reject refresh when the session user is missing", async () => {
    (RefreshJwt.verify as jest.Mock).mockReturnValue({ sid: "session-id" });
    sessionRepository.findByIdWithUser.mockResolvedValue({
      session,
      user: undefined,
    });

    await expect(
      service.refresh(
        {
          cookies: { refresh_token: "refresh-token" },
        } as unknown as FastifyRequest,
        reply,
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("should compare the presented refresh token with the stored hash", async () => {
    (RefreshJwt.verify as jest.Mock).mockReturnValue({ sid: "session-id" });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    sessionRepository.findByIdWithUser.mockResolvedValue({ session, user });
    sessionRepository.updateRefreshToken.mockResolvedValue(session);

    await service.refresh(
      {
        cookies: { refresh_token: "refresh-token" },
      } as unknown as FastifyRequest,
      reply,
    );

    expect(bcrypt.compare).toHaveBeenCalledWith(
      "refresh-token",
      session.refreshTokenHash,
    );
  });

  it("should propagate a token rotation database error", async () => {
    (RefreshJwt.verify as jest.Mock).mockReturnValue({ sid: "session-id" });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    sessionRepository.findByIdWithUser.mockResolvedValue({ session, user });
    sessionRepository.updateRefreshToken.mockRejectedValue(
      new Error("Database error"),
    );

    await expect(
      service.refresh(
        {
          cookies: { refresh_token: "refresh-token" },
        } as unknown as FastifyRequest,
        reply,
      ),
    ).rejects.toThrow("Database error");
    expect(reply.setCookie).not.toHaveBeenCalled();
  });

  it("should rotate a valid refresh token", async () => {
    (RefreshJwt.verify as jest.Mock).mockReturnValue({ sid: "session-id" });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    sessionRepository.findByIdWithUser.mockResolvedValue({ session, user });
    sessionRepository.updateRefreshToken.mockResolvedValue(session);

    await expect(
      service.refresh(
        {
          cookies: { refresh_token: "refresh-token" },
        } as unknown as FastifyRequest,
        reply,
      ),
    ).resolves.toEqual({ access_token: "access-token" });
    expect(sessionRepository.updateRefreshToken).toHaveBeenCalled();
  });

  it("should pass the previous hash to the conditional token rotation", async () => {
    (RefreshJwt.verify as jest.Mock).mockReturnValue({ sid: "session-id" });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    sessionRepository.findByIdWithUser.mockResolvedValue({ session, user });
    sessionRepository.updateRefreshToken.mockResolvedValue(session);

    await service.refresh(
      {
        cookies: { refresh_token: "refresh-token" },
      } as unknown as FastifyRequest,
      reply,
    );

    expect(sessionRepository.updateRefreshToken).toHaveBeenCalledWith(
      session.id,
      session.refreshTokenHash,
      "hashed-refresh-token",
    );
  });

  it("should reject refresh when conditional token rotation updates no session", async () => {
    (RefreshJwt.verify as jest.Mock).mockReturnValue({ sid: "session-id" });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    sessionRepository.findByIdWithUser.mockResolvedValue({ session, user });
    sessionRepository.updateRefreshToken.mockResolvedValue(undefined);

    await expect(
      service.refresh(
        {
          cookies: { refresh_token: "refresh-token" },
        } as unknown as FastifyRequest,
        reply,
      ),
    ).rejects.toThrow("already rotated");
    expect(reply.setCookie).not.toHaveBeenCalled();
  });

  it("should revoke the session when the refresh token hash does not match", async () => {
    (RefreshJwt.verify as jest.Mock).mockReturnValue({ sid: "session-id" });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    sessionRepository.findByIdWithUser.mockResolvedValue({ session, user });

    await expect(
      service.refresh(
        {
          cookies: { refresh_token: "stolen-token" },
        } as unknown as FastifyRequest,
        reply,
      ),
    ).rejects.toThrow(UnauthorizedException);
    expect(sessionRepository.updateRevokedAt).toHaveBeenCalledWith(
      "session-id",
    );
  });

  it("should revoke the session and clear the cookie on logout", async () => {
    (RefreshJwt.verify as jest.Mock).mockReturnValue({ sid: "session-id" });

    await expect(
      service.logout(
        {
          cookies: { refresh_token: "refresh-token" },
        } as unknown as FastifyRequest,
        reply,
      ),
    ).resolves.toEqual(
      expect.objectContaining({ message: "Logged out successfully" }),
    );
    expect(sessionRepository.updateRevokedAt).toHaveBeenCalledWith(
      "session-id",
    );
    expect(reply.clearCookie).toHaveBeenCalledWith(
      "refresh_token",
      expect.objectContaining({ path: "/auth" }),
    );
  });

  it("should reject logout when the refresh cookie is missing", async () => {
    await expect(
      service.logout({ cookies: {} } as unknown as FastifyRequest, reply),
    ).rejects.toThrow(UnauthorizedException);
    expect(sessionRepository.updateRevokedAt).not.toHaveBeenCalled();
    expect(reply.clearCookie).not.toHaveBeenCalled();
  });

  it("should reject logout when the refresh token is invalid", async () => {
    (RefreshJwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    await expect(
      service.logout(
        {
          cookies: { refresh_token: "refresh-token" },
        } as unknown as FastifyRequest,
        reply,
      ),
    ).rejects.toThrow(UnauthorizedException);
    expect(sessionRepository.updateRevokedAt).not.toHaveBeenCalled();
  });

  it("should clear the logout cookie with the refresh route and security options", async () => {
    (RefreshJwt.verify as jest.Mock).mockReturnValue({ sid: "session-id" });

    await service.logout(
      {
        cookies: { refresh_token: "refresh-token" },
      } as unknown as FastifyRequest,
      reply,
    );

    expect(reply.clearCookie).toHaveBeenCalledWith(
      "refresh_token",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/auth",
      }),
    );
  });

  it("should return a logout message with an ISO timestamp", async () => {
    (RefreshJwt.verify as jest.Mock).mockReturnValue({ sid: "session-id" });

    const result = await service.logout(
      {
        cookies: { refresh_token: "refresh-token" },
      } as unknown as FastifyRequest,
      reply,
    );

    expect(result.message).toBe("Logged out successfully");
    expect(result.timestamp).toBe(new Date(result.timestamp).toISOString());
  });

  it("should propagate a logout repository error", async () => {
    (RefreshJwt.verify as jest.Mock).mockReturnValue({ sid: "session-id" });
    sessionRepository.updateRevokedAt.mockRejectedValue(
      new Error("Database error"),
    );

    await expect(
      service.logout(
        {
          cookies: { refresh_token: "refresh-token" },
        } as unknown as FastifyRequest,
        reply,
      ),
    ).rejects.toThrow("Database error");
    expect(reply.clearCookie).not.toHaveBeenCalled();
  });

  it("should look up the session using the token session ID", async () => {
    sessionRepository.findByIdWithUser.mockResolvedValue({ session, user });

    await service.validateSession({
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionId: session.id,
    });

    expect(sessionRepository.findByIdWithUser).toHaveBeenCalledWith(session.id);
  });

  it("should reject a token whose subject does not match the session user", async () => {
    sessionRepository.findByIdWithUser.mockResolvedValue({ session, user });

    await expect(
      service.validateSession({
        sub: "different-user",
        email: user.email,
        role: user.role,
        sessionId: session.id,
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("should reject validation when no session is found", async () => {
    sessionRepository.findByIdWithUser.mockResolvedValue(undefined);

    await expect(
      service.validateSession({
        sub: user.id,
        email: user.email,
        role: user.role,
        sessionId: session.id,
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it.each([
    ["revoked", { ...session, revokedAt: new Date() }, user],
    ["expired", { ...session, expiresAt: new Date(Date.now() - 1) }, user],
    ["inactive", session, { ...user, isActive: false }],
  ])(
    "should reject validation for a %s session or user",
    async (_reason, currentSession, currentUser) => {
      sessionRepository.findByIdWithUser.mockResolvedValue({
        session: currentSession,
        user: currentUser,
      });

      await expect(
        service.validateSession({
          sub: user.id,
          email: user.email,
          role: user.role,
          sessionId: session.id,
        }),
      ).rejects.toThrow(UnauthorizedException);
    },
  );

  it("should propagate a session lookup error during validation", async () => {
    sessionRepository.findByIdWithUser.mockRejectedValue(
      new Error("Database error"),
    );

    await expect(
      service.validateSession({
        sub: user.id,
        email: user.email,
        role: user.role,
        sessionId: session.id,
      }),
    ).rejects.toThrow("Database error");
  });

  it("should validate the session subject and return a safe user", async () => {
    sessionRepository.findByIdWithUser.mockResolvedValue({
      session,
      user: { ...user, passwordHash: "secret" },
    });

    await expect(
      service.validateSession({
        sub: user.id,
        email: user.email,
        role: user.role,
        sessionId: session.id,
      }),
    ).resolves.not.toHaveProperty("passwordHash");
  });
});
