import { Test, TestingModule } from "@nestjs/testing";
import { UnauthorizedException } from "@nestjs/common";

import { AuthService } from "../../../auth/auth.service";
import { UserRepository } from "../../../repositories/auth";

describe("AuthService", () => {
  let service: AuthService;
  let userRepository: { findById: jest.Mock };

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserRepository, useValue: { findById: jest.fn() } },
      ],
    }).compile();

    service = module.get(AuthService);
    userRepository = module.get(UserRepository);
  });

  it("should return the public profile for an active user", async () => {
    userRepository.findById.mockResolvedValue(user);

    await expect(
      service.me({ id: user.id, email: user.email, role: user.role }),
    ).resolves.toEqual({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      createdAt: user.createdAt,
      emailVerifiedAt: user.emailVerifiedAt,
      phoneVerifiedAt: user.phoneVerifiedAt,
      updatedAt: user.updatedAt,
      isActive: user.isActive,
    });
  });

  it("should not expose the password hash", async () => {
    userRepository.findById.mockResolvedValue(user);

    const result = await service.me({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    expect(result).not.toHaveProperty("passwordHash");
  });

  it.each([
    [undefined, "User not found"],
    [{ ...user, isActive: false }, "User is inactive"],
  ])("should reject an invalid profile", async (dbUser, message) => {
    userRepository.findById.mockResolvedValue(dbUser);

    await expect(
      service.me({ id: user.id, email: user.email, role: user.role }),
    ).rejects.toThrow(new UnauthorizedException(message));
  });
});
