import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "../../auth/auth.service";
import { SessionRepository, UserRepository } from "../../repositories/auth";
import { JwtService } from "@nestjs/jwt";
import { RegisterInput } from "@lnq/shared";
import { FastifyReply, FastifyRequest } from "fastify";
import * as bcrypt from "bcrypt";
import * as RefreshJwt from "jsonwebtoken";
import { ConflictException } from "@nestjs/common";

jest.mock("bcrypt");
jest.mock("jsonwebtoken");

describe("AuthService", () => {
  let service: AuthService;
  let userRepository: jest.Mocked<UserRepository>;
  let sessionRepository: jest.Mocked<SessionRepository>;
  let jwtService: jest.Mocked<JwtService>;

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

    const res = {
      setCookie: jest.fn(),
    } as unknown as FastifyReply;

    it("should create a new user", async () => {
      userRepository.findByEmail.mockResolvedValue(undefined);

      userRepository.create.mockResolvedValue({
        id: "user-id",
        email: payload.email,
        name: payload.name,
        passwordHash: "hashed-password",
        role: "CUSTOMER",
        isActive: true,
        phone: null,
        phoneVerifiedAt: null,
        emailVerifiedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      sessionRepository.create.mockResolvedValue({
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        id: "session-id",
        ipAddress: req.ip,
        lastUsedAt: new Date(),
        refreshTokenHash: "hashed-refresh",
        revokedAt: null,
        userAgent: req.headers["user-agent"] || "Unknown",
        userId: "user-id",
      });

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

      expect(sessionRepository.create).toHaveBeenCalled();

      expect(res.setCookie).toHaveBeenCalled();

      expect(jwtService.sign).toHaveBeenCalled();
    });

    it("should throw a ConflictException if the email is already registered", async () => {
      userRepository.findByEmail.mockResolvedValue({
        id: "user-id",
        email: "test@example.com",
        name: "Test User",
        passwordHash: "PasswordHash",
        phone: null,
        createdAt: new Date(),
        emailVerifiedAt: null,
        isActive: true,
        phoneVerifiedAt: null,
        role: "CUSTOMER",
        updatedAt: new Date(),
      });

      await expect(service.register(payload, req, res)).rejects.toThrow(
        ConflictException,
      );

      expect(userRepository.create).not.toHaveBeenCalled();
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(res.setCookie).not.toHaveBeenCalled();
    });

    it("should not hash the password if the email is already registered", () => {});
    it("should not create a user if the email is already registered", () => {});
    it("should not log the user in if the email is already registered", () => {});

    it("should propagate the error if finding the user by email fails", () => {});

    it("should propagate the error if password hashing fails", () => {});
    it("should not create a user if password hashing fails", () => {});
    it("should not log the user in if password hashing fails", () => {});

    it("should propagate the error if user creation fails", () => {});
    it("should not log the user in if user creation fails", () => {});

    it("should log the newly created user in", () => {});

    it("should propagate the error if session creation fails", () => {});
    it("should propagate the error if access token generation fails", () => {});
    it("should propagate the error if setting the refresh token cookie fails", () => {});

    it("should use the hashed password when creating the user", () => {});
    it("should pass the correct user data when creating the user", () => {});

    it("should use the request IP when creating the session", () => {});
    it("should use the user-agent when creating the session", () => {});
    it("should use 'Unknown' when the user-agent is missing", () => {});
  });
});
