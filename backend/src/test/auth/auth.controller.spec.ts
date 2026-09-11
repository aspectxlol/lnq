import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "../../auth/auth.controller";
import { AuthService } from "../../auth/auth.service";
import { RegisterInput } from "@lnq/shared";
import { FastifyReply, FastifyRequest } from "fastify";
import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { LinkProviderDto } from "../../auth/interfaces/link.dto";
import { SafeUser } from "../../auth/interfaces/jwt.interface";
import { GoogleProfileData } from "../../auth/interfaces/google.interface";
import { AuthUser } from "../../auth/interfaces/auth-user.interface";

describe("AuthController", () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockReq = {
    ip: "127.0.0.1",
    headers: {
      "user-agent": "test-agent",
    },
  } as FastifyRequest;

  const mockRes = {
    setCookie: jest.fn(),
    clearCookie: jest.fn(),
    redirect: jest.fn(),
  } as unknown as FastifyReply;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            logout: jest.fn(),
            refresh: jest.fn(),
            linkGoogleAccount: jest.fn(),
            createGoogleLinkState: jest.fn(),
            verifyGoogleLinkState: jest.fn(),
            getSafeUserForLink: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);

    jest.clearAllMocks();
    (mockRes.setCookie as jest.Mock).mockReset();
    (mockRes.clearCookie as jest.Mock).mockReset();
    (mockRes.redirect as jest.Mock).mockReset();
  });

  describe("register", () => {
    const payload: RegisterInput = {
      email: "test@example.com",
      name: "Test User",
      password: "testpassword123",
    };

    const mockAuthResponse = {
      access_token: "access-token",
      userid: "user-id",
    };

    it("should register a user and return an auth payload", async () => {
      authService.register.mockResolvedValue(mockAuthResponse);

      const result = await controller.register(payload, mockReq, mockRes);

      expect(result).toEqual(mockAuthResponse);
      expect(authService.register).toHaveBeenCalledWith(
        payload,
        mockReq,
        mockRes,
      );
    });

    it("should throw ConflictException if the email is already in use", async () => {
      authService.register.mockRejectedValue(
        new ConflictException("Email already exists"),
      );

      await expect(
        controller.register(payload, mockReq, mockRes),
      ).rejects.toThrow(ConflictException);
    });

    it("should pass the request payload and Fastify contexts down to AuthService", async () => {
      authService.register.mockResolvedValue(mockAuthResponse);

      await controller.register(payload, mockReq, mockRes);

      expect(authService.register).toHaveBeenCalledTimes(1);
      expect(authService.register).toHaveBeenCalledWith(
        payload,
        mockReq,
        mockRes,
      );
    });
  });

  describe("linkGoogleAccount", () => {
    const linkDto: LinkProviderDto = {
      providerAccountId: "google-account-id",
    };

    const authorizedReq = {
      ...mockReq,
      user: {
        id: "user-id",
        email: "test@example.com",
        role: "CUSTOMER",
      },
    } as unknown as FastifyRequest;

    it("should call the linking service", async () => {
      authService.linkGoogleAccount.mockResolvedValue(undefined);

      await controller.linkGoogleAccount(authorizedReq, linkDto);

      expect(authService.linkGoogleAccount).toHaveBeenCalledWith(
        "GOOGLE",
        authorizedReq.user,
        linkDto,
      );
    });

    it("should resolve when the service succeeds", async () => {
      authService.linkGoogleAccount.mockResolvedValue(undefined);

      await expect(
        controller.linkGoogleAccount(authorizedReq, linkDto),
      ).resolves.toBeUndefined();
    });

    it("should propagate service errors", async () => {
      authService.linkGoogleAccount.mockRejectedValue(
        new UnauthorizedException("User missing"),
      );

      await expect(
        controller.linkGoogleAccount(authorizedReq, linkDto),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("linkGoogleAccountStart", () => {
    const safeUser: SafeUser = {
      id: "user-id",
      email: "test@example.com",
      name: "Test User",
      role: "CUSTOMER",
      createdAt: new Date(),
      updatedAt: new Date(),
      phone: null,
      phoneVerifiedAt: null,
      emailVerifiedAt: null,
      isActive: true,
    };

    const req = {
      ...mockReq,
      user: safeUser,
    } as unknown as FastifyRequest;

    it("should redirect to Google with state", async () => {
      authService.createGoogleLinkState.mockReturnValue("state-token");

      await controller.linkGoogleAccountStart(req, mockRes);

      expect(authService.createGoogleLinkState).toHaveBeenCalledWith(safeUser);
      expect(mockRes.redirect).toHaveBeenCalledWith(
        "/auth/google?state=state-token",
      );
    });
  });

  describe("googleAuthCallback", () => {
    const googleUser: AuthUser & GoogleProfileData = {
      id: "google-user",
      email: "google@example.com",
      role: "CUSTOMER",
      providerAccountId: "google-provider",
      name: "Google User",
      emailVerified: true,
    };

    const callbackReq = {
      ...mockReq,
      user: googleUser,
      query: {},
    } as unknown as FastifyRequest;

    it("should link when a valid state is provided", async () => {
      const reqWithState = {
        ...callbackReq,
        query: { state: "state-token" },
      } as FastifyRequest;
      authService.verifyGoogleLinkState.mockReturnValue("target-user");
      const safeUser: SafeUser = {
        id: "target-user",
        email: "target@example.com",
        name: "Target",
        role: "CUSTOMER",
        createdAt: new Date(),
        updatedAt: new Date(),
        phone: null,
        phoneVerifiedAt: null,
        emailVerifiedAt: null,
        isActive: true,
      };
      (authService.getSafeUserForLink as jest.Mock).mockResolvedValue(safeUser);
      authService.linkGoogleAccount.mockResolvedValue(undefined);

      const result = await controller.googleAuthCallback(
        reqWithState,
        "state-token",
        mockRes,
      );

      expect(authService.verifyGoogleLinkState).toHaveBeenCalledWith(
        "state-token",
      );
      expect(authService.getSafeUserForLink).toHaveBeenCalledWith(
        "target-user",
      );
      expect(authService.linkGoogleAccount).toHaveBeenCalledWith(
        "GOOGLE",
        safeUser,
        {
          providerAccountId: googleUser.providerAccountId,
          email: googleUser.email,
          name: googleUser.name,
        },
      );
      expect(result).toEqual({ message: "Google account linked" });
    });

    it("should delegate to login when no state", async () => {
      authService.login.mockResolvedValue({
        access_token: "token",
        userid: "id",
      });

      const result = await controller.googleAuthCallback(
        callbackReq,
        undefined,
        mockRes,
      );

      expect(authService.login).toHaveBeenCalledWith(
        googleUser,
        callbackReq,
        mockRes,
      );
      expect(result).toEqual({ access_token: "token", userid: "id" });
    });
  });
});
