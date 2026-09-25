import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "../../auth/auth.controller";
import { AuthService } from "../../auth/auth.service";
import { CredentialsService } from "../../auth/service/credentials.service";
import { GoogleAuthService } from "../../auth/service/google-auth.service";
import { SessionService } from "../../auth/service/session.service";
import { RegisterInput } from "@lnq/shared";
import { FastifyReply, FastifyRequest } from "fastify";
import { ConflictException } from "@nestjs/common";
import { SafeUser } from "../../auth/interfaces/jwt.interface";
import { GoogleProfileData } from "../../auth/interfaces/google.interface";
import { AuthUser } from "../../auth/interfaces/auth-user.interface";

describe("AuthController", () => {
  let controller: AuthController;
  let credentialsService: jest.Mocked<CredentialsService>;
  let googleAuthService: jest.Mocked<GoogleAuthService>;

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
            me: jest.fn(),
          },
        },
        {
          provide: CredentialsService,
          useValue: { register: jest.fn() },
        },
        {
          provide: SessionService,
          useValue: { login: jest.fn(), refresh: jest.fn(), logout: jest.fn() },
        },
        {
          provide: GoogleAuthService,
          useValue: {
            createGoogleLinkState: jest.fn(),
            handleGoogleCallback: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    credentialsService = module.get(CredentialsService);
    googleAuthService = module.get(GoogleAuthService);

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
      credentialsService.register.mockResolvedValue(mockAuthResponse);

      const result = await controller.register(payload, mockReq, mockRes);

      expect(result).toEqual(mockAuthResponse);
      expect(credentialsService.register).toHaveBeenCalledWith(
        payload,
        mockReq,
        mockRes,
      );
    });

    it("should throw ConflictException if the email is already in use", async () => {
      credentialsService.register.mockRejectedValue(
        new ConflictException("Email already exists"),
      );

      await expect(
        controller.register(payload, mockReq, mockRes),
      ).rejects.toThrow(ConflictException);
    });

    it("should pass the request payload and Fastify contexts to CredentialsService", async () => {
      credentialsService.register.mockResolvedValue(mockAuthResponse);

      await controller.register(payload, mockReq, mockRes);

      expect(credentialsService.register).toHaveBeenCalledTimes(1);
      expect(credentialsService.register).toHaveBeenCalledWith(
        payload,
        mockReq,
        mockRes,
      );
    });
  });

  describe("startGoogleLink", () => {
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
      googleAuthService.createGoogleLinkState.mockReturnValue("state-token");

      await controller.startGoogleLink(req, mockRes);

      expect(googleAuthService.createGoogleLinkState).toHaveBeenCalledWith(
        safeUser,
      );
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
      googleAuthService.handleGoogleCallback.mockResolvedValue({
        message: "Google account linked",
      });

      const result = await controller.googleAuthCallback(
        reqWithState,
        "state-token",
        mockRes,
      );

      expect(googleAuthService.handleGoogleCallback).toHaveBeenCalledWith(
        googleUser,
        "state-token",
        reqWithState,
        mockRes,
      );
      expect(result).toEqual({ message: "Google account linked" });
    });

    it("should delegate to login when no state", async () => {
      googleAuthService.handleGoogleCallback.mockResolvedValue({
        access_token: "token",
        userid: "id",
      });

      const result = await controller.googleAuthCallback(
        callbackReq,
        undefined,
        mockRes,
      );

      expect(googleAuthService.handleGoogleCallback).toHaveBeenCalledWith(
        googleUser,
        undefined,
        callbackReq,
        mockRes,
      );
      expect(result).toEqual({ access_token: "token", userid: "id" });
    });
  });
});
