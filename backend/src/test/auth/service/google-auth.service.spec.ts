import { Test, TestingModule } from "@nestjs/testing";
import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { FastifyReply, FastifyRequest } from "fastify";

import { GoogleAuthService } from "../../../auth/service/google-auth.service";
import { SessionService } from "../../../auth/service/session.service";
import { AccountRepository, UserRepository } from "../../../repositories/auth";

describe("GoogleAuthService", () => {
  let service: GoogleAuthService;
  let userRepository: {
    findById: jest.Mock;
    findByEmail: jest.Mock;
    create: jest.Mock;
  };
  let accountRepository: {
    findProviderByAccountIdWithUser: jest.Mock;
    create: jest.Mock;
  };
  let accessJwtService: { sign: jest.Mock; verify: jest.Mock };
  let sessionService: { login: jest.Mock };

  const user = {
    id: "user-id",
    email: "test@example.com",
    passwordHash: undefined,
    role: "CUSTOMER" as const,
    name: "Test User",
    phone: null,
    phoneVerifiedAt: null,
    emailVerifiedAt: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const googleUser = {
    providerAccountId: "google-id",
    email: user.email,
    name: user.name,
    emailVerified: true,
  };
  const request = {} as FastifyRequest;
  const reply = {} as FastifyReply;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleAuthService,
        {
          provide: UserRepository,
          useValue: {
            findById: jest.fn(),
            findByEmail: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: AccountRepository,
          useValue: {
            findProviderByAccountIdWithUser: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn(), verify: jest.fn() },
        },
        { provide: SessionService, useValue: { login: jest.fn() } },
      ],
    }).compile();

    service = module.get(GoogleAuthService);
    userRepository = module.get(UserRepository);
    accountRepository = module.get(AccountRepository);
    accessJwtService = module.get(JwtService);
    sessionService = module.get(SessionService);
    jest.resetAllMocks();
  });

  describe("loginWithGoogle", () => {
    it("should log in an existing linked account", async () => {
      accountRepository.findProviderByAccountIdWithUser.mockResolvedValue({
        accounts: { userId: user.id },
      });
      userRepository.findById.mockResolvedValue(user);
      sessionService.login.mockResolvedValue({ access_token: "token" });

      await expect(
        service.loginWithGoogle(googleUser, request, reply),
      ).resolves.toEqual({ access_token: "token" });
      expect(sessionService.login).toHaveBeenCalledWith(
        { id: user.id, email: user.email, role: user.role },
        request,
        reply,
      );
    });

    it("should create and link a new user", async () => {
      accountRepository.findProviderByAccountIdWithUser.mockResolvedValue(
        undefined,
      );
      userRepository.findByEmail.mockResolvedValue(undefined);
      userRepository.create.mockResolvedValue(user);
      sessionService.login.mockResolvedValue({ access_token: "token" });

      await service.loginWithGoogle(googleUser, request, reply);

      expect(accountRepository.create).toHaveBeenCalledWith({
        provider: "GOOGLE",
        providerAccountId: googleUser.providerAccountId,
        userId: user.id,
      });
    });

    it("should reject a Google email already used by another account", async () => {
      accountRepository.findProviderByAccountIdWithUser.mockResolvedValue(
        undefined,
      );
      userRepository.findByEmail.mockResolvedValue(user);

      await expect(
        service.loginWithGoogle(googleUser, request, reply),
      ).rejects.toThrow(ConflictException);
    });

    it("should reject a linked account when its user does not exist", async () => {
      accountRepository.findProviderByAccountIdWithUser.mockResolvedValue({
        accounts: { userId: user.id },
      });
      userRepository.findById.mockResolvedValue(undefined);

      await expect(
        service.loginWithGoogle(googleUser, request, reply),
      ).rejects.toThrow(new UnauthorizedException("User not found"));
      expect(sessionService.login).not.toHaveBeenCalled();
    });

    it("should reject a linked account when its user is inactive", async () => {
      accountRepository.findProviderByAccountIdWithUser.mockResolvedValue({
        accounts: { userId: user.id },
      });
      userRepository.findById.mockResolvedValue({ ...user, isActive: false });

      await expect(
        service.loginWithGoogle(googleUser, request, reply),
      ).rejects.toThrow(new UnauthorizedException("User is inactive"));
    });

    it("should pass the new Google user fields to the user repository", async () => {
      accountRepository.findProviderByAccountIdWithUser.mockResolvedValue(
        undefined,
      );
      userRepository.findByEmail.mockResolvedValue(undefined);
      userRepository.create.mockResolvedValue(user);
      sessionService.login.mockResolvedValue({ access_token: "token" });

      await service.loginWithGoogle(googleUser, request, reply);

      expect(userRepository.create).toHaveBeenCalledWith({
        name: googleUser.name,
        email: googleUser.email,
        passwordHash: undefined,
      });
    });

    it("should propagate a Google user creation error", async () => {
      accountRepository.findProviderByAccountIdWithUser.mockResolvedValue(
        undefined,
      );
      userRepository.findByEmail.mockResolvedValue(undefined);
      userRepository.create.mockRejectedValue(new Error("Create error"));

      await expect(
        service.loginWithGoogle(googleUser, request, reply),
      ).rejects.toThrow("Create error");
      expect(accountRepository.create).not.toHaveBeenCalled();
    });

    it("should propagate a Google account creation error", async () => {
      accountRepository.findProviderByAccountIdWithUser.mockResolvedValue(
        undefined,
      );
      userRepository.findByEmail.mockResolvedValue(undefined);
      userRepository.create.mockResolvedValue(user);
      accountRepository.create.mockRejectedValue(new Error("Account error"));

      await expect(
        service.loginWithGoogle(googleUser, request, reply),
      ).rejects.toThrow("Account error");
      expect(sessionService.login).not.toHaveBeenCalled();
    });
  });

  describe("linkGoogleAccount", () => {
    it("should reject unauthenticated requests", async () => {
      await expect(
        service.linkGoogleAccount(undefined as never, googleUser),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should create a link for an authenticated user", async () => {
      accountRepository.findProviderByAccountIdWithUser.mockResolvedValue(
        undefined,
      );

      await service.linkGoogleAccount(user, googleUser);

      expect(accountRepository.create).toHaveBeenCalledWith({
        provider: "GOOGLE",
        providerAccountId: googleUser.providerAccountId,
        userId: user.id,
      });
    });

    it("should return without creating a duplicate link for the same user", async () => {
      accountRepository.findProviderByAccountIdWithUser.mockResolvedValue({
        accounts: { userId: user.id },
      });

      await expect(
        service.linkGoogleAccount(user, googleUser),
      ).resolves.toBeUndefined();
      expect(accountRepository.create).not.toHaveBeenCalled();
    });

    it("should reject a Google account linked to another user", async () => {
      accountRepository.findProviderByAccountIdWithUser.mockResolvedValue({
        accounts: { userId: "other-user-id" },
      });

      await expect(service.linkGoogleAccount(user, googleUser)).rejects.toThrow(
        ConflictException,
      );
      expect(accountRepository.create).not.toHaveBeenCalled();
    });
  });

  describe("link state", () => {
    it("should create and verify a link state", () => {
      accessJwtService.sign.mockReturnValue("state-token");
      accessJwtService.verify.mockReturnValue({
        sub: user.id,
        purpose: "LINK_GOOGLE",
      });

      expect(service.createGoogleLinkState(user)).toBe("state-token");
      expect(service.verifyLinkState("state-token")).toBe(user.id);
    });

    it("should reject an invalid link state", () => {
      accessJwtService.verify.mockReturnValue({
        sub: user.id,
        purpose: "WRONG",
      });

      expect(() => service.verifyLinkState("state-token")).toThrow(
        UnauthorizedException,
      );
    });

    it("should reject a link state without a subject", () => {
      accessJwtService.verify.mockReturnValue({ purpose: "LINK_GOOGLE" });

      expect(() => service.verifyLinkState("state-token")).toThrow(
        UnauthorizedException,
      );
    });

    it("should reject a link state when token verification fails", () => {
      accessJwtService.verify.mockImplementation(() => {
        throw new Error("Invalid token");
      });

      expect(() => service.verifyLinkState("state-token")).toThrow(
        UnauthorizedException,
      );
    });

    it("should sign a link state with the user, purpose, nonce, and expiry", () => {
      jest
        .spyOn(crypto, "randomUUID")
        .mockReturnValue("bbbb-cccc-dddd-eeee-ffff");
      accessJwtService.sign.mockReturnValue("state-token");

      expect(service.createGoogleLinkState(user)).toBe("state-token");
      expect(accessJwtService.sign).toHaveBeenCalledWith(
        {
          sub: user.id,
          purpose: "LINK_GOOGLE",
          nonce: "bbbb-cccc-dddd-eeee-ffff",
        },
        { expiresIn: "5m" },
      );
    });
  });

  describe("getSafeUserForLink", () => {
    it("should return an active user without the password hash", async () => {
      userRepository.findById.mockResolvedValue(user);

      await expect(service.getSafeUserForLink(user.id)).resolves.toEqual({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        phoneVerifiedAt: user.phoneVerifiedAt,
        emailVerifiedAt: user.emailVerifiedAt,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    });

    it.each([undefined, { ...user, isActive: false }])(
      "should reject a missing or inactive link target",
      async (targetUser) => {
        userRepository.findById.mockResolvedValue(targetUser);

        await expect(service.getSafeUserForLink(user.id)).rejects.toThrow(
          UnauthorizedException,
        );
      },
    );

    it("should propagate a link target lookup error", async () => {
      userRepository.findById.mockRejectedValue(new Error("Database error"));

      await expect(service.getSafeUserForLink(user.id)).rejects.toThrow(
        "Database error",
      );
    });
  });

  describe("handleGoogleCallback", () => {
    it("should log in through Google when no link state is provided", async () => {
      jest.spyOn(service, "loginWithGoogle").mockResolvedValue({
        access_token: "token",
        userid: user.id,
      });

      await expect(
        service.handleGoogleCallback(googleUser, undefined, request, reply),
      ).resolves.toEqual({ access_token: "token", userid: user.id });
      expect(service.loginWithGoogle).toHaveBeenCalledWith(
        googleUser,
        request,
        reply,
      );
    });

    it("should link the Google account when link state is provided", async () => {
      jest.spyOn(service, "verifyLinkState").mockReturnValue(user.id);
      jest.spyOn(service, "getSafeUserForLink").mockResolvedValue(user);
      jest.spyOn(service, "linkGoogleAccount").mockResolvedValue(undefined);

      await expect(
        service.handleGoogleCallback(googleUser, "state-token", request, reply),
      ).resolves.toEqual({ message: "Google account linked" });
      expect(service.linkGoogleAccount).toHaveBeenCalledWith(user, googleUser);
    });
  });
});
