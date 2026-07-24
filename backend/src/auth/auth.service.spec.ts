import { JwtService } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import { PrismaService } from "../prisma/prisma.service";
import type { Profile } from "passport-google-oauth20";

describe("AuthService", () => {
  let service: AuthService;

  beforeEach(() => {
    const users: Array<Record<string, unknown>> = [];
    const sessions: Array<Record<string, unknown>> = [];
    const prisma = {
      user: {
        findFirst: jest.fn(
          (args?: {
            where?: { id?: number; email?: string; phone?: string };
          }) => {
            const where = args?.where ?? {};
            return users.find((user) => {
              if (where.id !== undefined && user.id !== where.id) {
                return false;
              }
              if (where.email && user.email !== where.email) {
                return false;
              }
              if (where.phone && user.phone !== where.phone) {
                return false;
              }
              return true;
            });
          },
        ),
        create: jest.fn((args?: { data?: Record<string, unknown> }) => {
          const user = {
            id: users.length + 1,
            emailVerified: false,
            role: "CUSTOMER",
            createdAt: new Date(),
            updatedAt: new Date(),
            ...args?.data,
          };
          users.push(user);
          return user;
        }),
        update: jest.fn(
          (args?: {
            where?: { id?: number };
            data?: Record<string, unknown>;
          }) => {
            const index = users.findIndex(
              (user) => user.id === args?.where?.id,
            );
            if (index >= 0) {
              users[index] = { ...users[index], ...args?.data };
              return users[index];
            }
            return null;
          },
        ),
      },
      session: {
        create: jest.fn((args?: { data?: Record<string, unknown> }) => {
          const session = {
            id: sessions.length + 1,
            ...args?.data,
          };
          sessions.push(session);
          return session;
        }),
        findFirst: jest.fn(
          (args?: { where?: { refreshTokenHash?: string } }) => {
            const refreshTokenHash = args?.where?.refreshTokenHash;
            return sessions.find(
              (session) => session.refreshTokenHash === refreshTokenHash,
            );
          },
        ),
      },
    } as unknown as PrismaService;

    const jwtService = {
      sign: jest.fn((payload: unknown) => `token-${JSON.stringify(payload)}`),
      verify: jest.fn((token: string) => {
        const value = token.replace(/^token-/, "");
        return JSON.parse(value);
      }),
    } as unknown as JwtService;

    service = new AuthService(prisma, jwtService);
  });

  it("registers a local user and allows login by email", async () => {
    const result = await service.registerLocal({
      firstName: "Alice",
      email: "alice@example.com",
      password: "secret",
    });

    expect(result.accessToken).toBeDefined();
    expect(result.user.firstName).toBe("Alice");
    expect(result.user.email).toBe("alice@example.com");

    const byEmail = await service.validateLocalUser(
      "alice@example.com",
      "secret",
    );

    expect(byEmail?.email).toBe("alice@example.com");
    expect(byEmail?.firstName).toBe("Alice");
  });

  it("issues and rotates refresh tokens", async () => {
    const registered = await service.registerLocal({
      firstName: "Bob",
      email: "bob@example.com",
      password: "secret",
    });

    const refreshed = await service.refreshAccessToken(
      registered.refreshToken as string,
    );

    expect(refreshed?.accessToken).toBeDefined();
    expect(refreshed?.refreshToken).toBeDefined();
    expect(refreshed?.user.email).toBe("bob@example.com");
  });

  it("creates or reuses a Google-authenticated user", async () => {
    const profile: Profile = {
      provider: "google",
      id: "google-123",
      displayName: "Google User",
      profileUrl: "https://google.com/user/google-123",
      emails: [{ value: "google@example.com", verified: true }],
      _raw: "",
      _json: {
        iss: "https://accounts.google.com",
        aud: "client-id",
        sub: "google-123",
        iat: 1710000000,
        exp: 1710003600,
        email: "google@example.com",
        email_verified: true,
        name: "Google User",
        given_name: "Google",
        family_name: "User",
        picture: "https://google.com/user/google-123",
      },
    };
    const result = await service.handleGoogleAuth(profile);

    expect(result.accessToken).toBeDefined();
    expect(result.user.email).toBe("google@example.com");
    expect(result.user.firstName).toBe("Google");
  });
});
