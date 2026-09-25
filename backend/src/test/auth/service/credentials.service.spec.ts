import { Test, TestingModule } from "@nestjs/testing";
import { ConflictException } from "@nestjs/common";
import { RegisterInput } from "@lnq/shared";
import { FastifyReply, FastifyRequest } from "fastify";
import * as bcrypt from "bcrypt";

import { CredentialsService } from "../../../auth/service/credentials.service";
import { SessionService } from "../../../auth/service/session.service";
import { UserRepository } from "../../../repositories/auth";

jest.mock("bcrypt");

describe("CredentialsService", () => {
  let service: CredentialsService;
  let userRepository: { findByEmail: jest.Mock; create: jest.Mock };
  let sessionService: { login: jest.Mock };

  const user = {
    id: "user-id",
    email: "test@example.com",
    passwordHash: "hashed-password",
    role: "CUSTOMER" as const,
    name: "Test User",
    phone: null,
    phoneVerifiedAt: null,
    emailVerifiedAt: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const request = {
    ip: "127.0.0.1",
    headers: { "user-agent": "test-agent" },
  } as FastifyRequest;
  const reply = {} as FastifyReply;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CredentialsService,
        {
          provide: UserRepository,
          useValue: { findByEmail: jest.fn(), create: jest.fn() },
        },
        { provide: SessionService, useValue: { login: jest.fn() } },
      ],
    }).compile();

    service = module.get(CredentialsService);
    userRepository = module.get(UserRepository);
    sessionService = module.get(SessionService);
    jest.resetAllMocks();
  });

  describe("register", () => {
    const input: RegisterInput = {
      email: "test@example.com",
      name: "Test User",
      password: "password123",
    };

    it("should create a user and start a session", async () => {
      userRepository.findByEmail.mockResolvedValue(undefined);
      userRepository.create.mockResolvedValue(user);
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-password");
      sessionService.login.mockResolvedValue({
        access_token: "token",
        userid: user.id,
      });

      await expect(service.register(input, request, reply)).resolves.toEqual({
        access_token: "token",
        userid: user.id,
      });
      expect(userRepository.create).toHaveBeenCalledWith({
        name: input.name,
        email: input.email,
        passwordHash: "hashed-password",
      });
    });

    it("should reject duplicate email addresses", async () => {
      userRepository.findByEmail.mockResolvedValue(user);

      await expect(service.register(input, request, reply)).rejects.toThrow(
        ConflictException,
      );
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it("should reject duplicate registration with the expected conflict message", async () => {
      userRepository.findByEmail.mockResolvedValue(user);

      await expect(service.register(input, request, reply)).rejects.toThrow(
        new ConflictException("Email already exists"),
      );
    });

    it("should look up registration by the submitted email", async () => {
      userRepository.findByEmail.mockResolvedValue(user);

      await expect(service.register(input, request, reply)).rejects.toThrow(
        ConflictException,
      );
      expect(userRepository.findByEmail).toHaveBeenCalledWith(input.email);
    });

    it("should not hash, create, or start a session for a duplicate email", async () => {
      userRepository.findByEmail.mockResolvedValue(user);

      await expect(service.register(input, request, reply)).rejects.toThrow(
        ConflictException,
      );
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(userRepository.create).not.toHaveBeenCalled();
      expect(sessionService.login).not.toHaveBeenCalled();
    });

    it("should propagate an email lookup error", async () => {
      userRepository.findByEmail.mockRejectedValue(new Error("Database error"));

      await expect(service.register(input, request, reply)).rejects.toThrow(
        "Database error",
      );
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it("should propagate a password hashing error", async () => {
      userRepository.findByEmail.mockResolvedValue(undefined);
      (bcrypt.hash as jest.Mock).mockRejectedValue(new Error("Hash error"));

      await expect(service.register(input, request, reply)).rejects.toThrow(
        "Hash error",
      );
      expect(userRepository.create).not.toHaveBeenCalled();
      expect(sessionService.login).not.toHaveBeenCalled();
    });

    it("should propagate a user creation error", async () => {
      userRepository.findByEmail.mockResolvedValue(undefined);
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-password");
      userRepository.create.mockRejectedValue(new Error("Create error"));

      await expect(service.register(input, request, reply)).rejects.toThrow(
        "Create error",
      );
      expect(sessionService.login).not.toHaveBeenCalled();
    });

    it("should pass the hashed password and registration fields to the repository", async () => {
      userRepository.findByEmail.mockResolvedValue(undefined);
      (bcrypt.hash as jest.Mock).mockResolvedValue("new-hash");
      userRepository.create.mockResolvedValue(user);
      sessionService.login.mockResolvedValue({ access_token: "token" });

      await service.register(input, request, reply);

      expect(bcrypt.hash).toHaveBeenCalledWith(input.password, 10);
      expect(userRepository.create).toHaveBeenCalledWith({
        name: input.name,
        email: input.email,
        passwordHash: "new-hash",
      });
    });

    it("should pass the created user to the session service", async () => {
      userRepository.findByEmail.mockResolvedValue(undefined);
      userRepository.create.mockResolvedValue(user);
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-password");
      sessionService.login.mockResolvedValue({ access_token: "token" });

      await service.register(input, request, reply);

      expect(sessionService.login).toHaveBeenCalledWith(
        { id: user.id, email: user.email, role: user.role },
        request,
        reply,
      );
    });

    it("should pass only the created user's safe identity to the session service", async () => {
      userRepository.findByEmail.mockResolvedValue(undefined);
      userRepository.create.mockResolvedValue({
        ...user,
        passwordHash: "stored-hash",
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue("stored-hash");
      sessionService.login.mockResolvedValue({ access_token: "token" });

      await service.register(input, request, reply);

      expect(sessionService.login.mock.calls[0][0]).toEqual({
        id: user.id,
        email: user.email,
        role: user.role,
      });
      expect(sessionService.login.mock.calls[0][0]).not.toHaveProperty(
        "passwordHash",
      );
    });

    it("should preserve registration values when creating the user", async () => {
      const specialInput: RegisterInput = {
        email: "new.user+tag@example.com",
        name: "New User / Tokyo",
        password: "correct horse battery staple",
      };
      userRepository.findByEmail.mockResolvedValue(undefined);
      userRepository.create.mockResolvedValue(user);
      (bcrypt.hash as jest.Mock).mockResolvedValue("special-hash");
      sessionService.login.mockResolvedValue({ access_token: "token" });

      await service.register(specialInput, request, reply);

      expect(userRepository.create).toHaveBeenCalledWith({
        name: specialInput.name,
        email: specialInput.email,
        passwordHash: "special-hash",
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(specialInput.password, 10);
    });

    it("should return the exact response produced by the session service", async () => {
      const response = { access_token: "token", userid: "created-user" };
      userRepository.findByEmail.mockResolvedValue(undefined);
      userRepository.create.mockResolvedValue({ ...user, id: "created-user" });
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-password");
      sessionService.login.mockResolvedValue(response);

      await expect(service.register(input, request, reply)).resolves.toBe(
        response,
      );
    });

    it("should start the session only after the user has been created", async () => {
      userRepository.findByEmail.mockResolvedValue(undefined);
      userRepository.create.mockResolvedValue(user);
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-password");
      sessionService.login.mockResolvedValue({ access_token: "token" });

      await service.register(input, request, reply);

      expect(userRepository.create.mock.invocationCallOrder[0]).toBeLessThan(
        sessionService.login.mock.invocationCallOrder[0],
      );
    });

    it("should propagate a session creation error", async () => {
      userRepository.findByEmail.mockResolvedValue(undefined);
      userRepository.create.mockResolvedValue(user);
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-password");
      sessionService.login.mockRejectedValue(new Error("Session error"));

      await expect(service.register(input, request, reply)).rejects.toThrow(
        "Session error",
      );
    });
  });

  describe("validateUser", () => {
    it("should return an auth user for valid credentials", async () => {
      userRepository.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        service.validateUser(user.email, "password"),
      ).resolves.toEqual({
        id: user.id,
        email: user.email,
        role: user.role,
      });
    });

    it("should return null for an unknown user", async () => {
      userRepository.findByEmail.mockResolvedValue(undefined);

      await expect(
        service.validateUser(user.email, "password"),
      ).resolves.toBeNull();
      expect(bcrypt.compare).toHaveBeenCalled();
    });

    it("should return null for an inactive user", async () => {
      userRepository.findByEmail.mockResolvedValue({
        ...user,
        isActive: false,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        service.validateUser(user.email, "password"),
      ).resolves.toBeNull();
    });

    it("should return null when the password is incorrect", async () => {
      userRepository.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.validateUser(user.email, "wrong-password"),
      ).resolves.toBeNull();
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "wrong-password",
        user.passwordHash,
      );
    });

    it("should compare the provided password against the stored hash", async () => {
      userRepository.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await service.validateUser(user.email, "password");

      expect(bcrypt.compare).toHaveBeenCalledWith(
        "password",
        user.passwordHash,
      );
    });

    it("should propagate a repository error during credential validation", async () => {
      userRepository.findByEmail.mockRejectedValue(new Error("Database error"));

      await expect(
        service.validateUser(user.email, "password"),
      ).rejects.toThrow("Database error");
    });

    it("should compare against a dummy hash when the user does not exist", async () => {
      userRepository.findByEmail.mockResolvedValue(undefined);

      await service.validateUser(user.email, "password");

      expect(bcrypt.compare).toHaveBeenCalledWith(
        "password",
        expect.stringMatching(/^\$2a\$12\$/),
      );
    });

    it("should return null even when the dummy password comparison succeeds", async () => {
      userRepository.findByEmail.mockResolvedValue(undefined);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        service.validateUser(user.email, "password"),
      ).resolves.toBeNull();
    });
  });
});
