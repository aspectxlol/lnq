/** @jest-environment @quramy/jest-prisma/environment */
declare const jestPrisma: { client: PrismaService };

import { JwtService } from "@nestjs/jwt";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { PrismaService } from "../prisma/prisma.service";

describe("AuthController", () => {
  let controller: AuthController;
  let prisma: PrismaService;

  beforeEach(() => {
    prisma = jestPrisma.client as PrismaService;
    const jwtService = {
      sign: jest.fn(() => "test-token"),
    } as unknown as JwtService;
    controller = new AuthController(new AuthService(prisma, jwtService));
  });

  it("registers a new local user", async () => {
    const result = await controller.register({
      username: "bob",
      email: "bob@example.com",
      password: "secret",
    });

    expect(result.user.username).toBe("bob");
    expect(result.user.email).toBe("bob@example.com");
    expect(result.accessToken).toBeDefined();
  });
});
