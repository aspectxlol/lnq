import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "../../auth/auth.controller";
import { AuthService } from "../../auth/auth.service";
import { RegisterInput } from "@lnq/shared";
import { FastifyReply, FastifyRequest } from "fastify";
import { ConflictException, UnauthorizedException } from "@nestjs/common";

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
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);

    jest.clearAllMocks();
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
});
