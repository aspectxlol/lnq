jest.mock("./auth.service", () => ({
  AuthService: class {},
}));

jest.mock("../prisma/prisma.service", () => ({
  PrismaService: class {},
}));

jest.mock("@prisma/client", () => require("../test-utils/prisma-client.mock"));

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

describe("AuthController", () => {
  let controller: AuthController;

  beforeEach(() => {
    const registerLocal = jest.fn(
      async (dto: { firstName: string; email: string; password: string }) => ({
        accessToken: "test-token",
        refreshToken: "refresh-token",
        user: {
          id: 1,
          firstName: dto.firstName,
          email: dto.email,
        },
      }),
    );

    const authService = {
      registerLocal,
      logout: jest.fn(async () => ({ success: true, message: "Logged out" })),
    } as unknown as AuthService;

    controller = new AuthController(authService);
  });

  it("registers a new local user", async () => {
    const result = await controller.register({
      firstName: "bob",
      email: "bob@example.com",
      password: "secret",
    });

    expect(result.user.firstName).toBe("bob");
    expect(result.user.email).toBe("bob@example.com");
    expect(result.accessToken).toBeDefined();
  });

  it("returns a success payload when login succeeds", async () => {
    const result = await controller.login({
      user: {
        accessToken: "test-token",
        refreshToken: "refresh-token",
        user: { id: 1, email: "bob@example.com" },
      },
    } as never);

    expect(result).toEqual({
      success: true,
      accessToken: "test-token",
      refreshToken: "refresh-token",
      user: { id: 1, email: "bob@example.com" },
    });
  });

  it("returns a logout success payload", async () => {
    const result = await controller.logout({ refreshToken: "refresh-token" });

    expect(result).toEqual({ success: true, message: "Logged out" });
  });
});
