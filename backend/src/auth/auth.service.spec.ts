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
            where?: { username?: string; email?: string; googleId?: string };
          }) => {
            const where = args?.where ?? {};
            return users.find((user) => {
              if (where.username && user.username !== where.username) {
                return false;
              }
              if (where.email && user.email !== where.email) {
                return false;
              }
              if (where.googleId && user.googleId !== where.googleId) {
                return false;
              }
              return true;
            });
          },
        ),
        create: jest.fn((args?: { data?: Record<string, unknown> }) => {
          const user = {
            id: `user-${users.length + 1}`,
            ...args?.data,
          };
          users.push(user);
          return user;
        }),
        update: jest.fn(
          (args?: {
            where?: { id?: string };
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
            id: `session-${sessions.length + 1}`,
            ...args?.data,
          };
          sessions.push(session);
          return session;
        }),
        findFirst: jest.fn((args?: { where?: { refreshToken?: string } }) => {
          const refreshToken = args?.where?.refreshToken;
          return sessions.find(
            (session) => session.refreshToken === refreshToken,
          );
        }),
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

  it("registers a local user and allows login by username or email", async () => {
    const result = await service.registerLocal({
      username: "alice",
      email: "alice@example.com",
      password: "secret",
    });

    expect(result.accessToken).toBeDefined();
    expect(result.user.username).toBe("alice");
    expect(result.user.email).toBe("alice@example.com");

    const byUsername = await service.validateLocalUser("alice", "secret");
    const byEmail = await service.validateLocalUser(
      "alice@example.com",
      "secret",
    );

    expect(byUsername?.email).toBe("alice@example.com");
    expect(byEmail?.username).toBe("alice");
  });

  it("issues and rotates refresh tokens", async () => {
    const registered = await service.registerLocal({
      username: "bob",
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
    expect(result.user.provider).toBe("google");
    expect(result.user.email).toBe("google@example.com");
  });
});
