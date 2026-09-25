import { INestApplication, UnauthorizedException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";

import { AuthController } from "../../auth/auth.controller";
import { AuthService } from "../../auth/auth.service";
import { JwtGuard } from "../../auth/guards/jwt.guard";
import { LocalAuthGuard } from "../../auth/guards/local-auth.guard";
import { CredentialsService } from "../../auth/service/credentials.service";
import { GoogleAuthService } from "../../auth/service/google-auth.service";
import { SessionService } from "../../auth/service/session.service";

describe("AuthController (e2e)", () => {
  let app: INestApplication;

  const authServiceMock = {
    me: jest.fn(),
  };
  const credentialsServiceMock = { register: jest.fn() };
  const sessionServiceMock = {
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
  };
  const googleAuthServiceMock = {
    createGoogleLinkState: jest.fn(),
    handleGoogleCallback: jest.fn(),
  };

  const localAuthGuardMock = {
    canActivate: (context: any) => {
      const req = context.switchToHttp().getRequest();
      if (
        req.body?.email === "valid@example.com" &&
        req.body?.password === "password123"
      ) {
        req.user = {
          id: "user-id",
          email: "valid@example.com",
          role: "CUSTOMER",
        };
        return true;
      }
      throw new UnauthorizedException("Invalid credentials");
    },
  };

  const jwtGuardMock = {
    canActivate: (context: any) => {
      const req = context.switchToHttp().getRequest();
      const authHeader = req.headers?.authorization;
      if (!authHeader) {
        throw new UnauthorizedException("Missing or invalid token");
      }

      req.user = {
        id: "user-id",
        email: "valid@example.com",
        role: "CUSTOMER",
      };
      return true;
    },
  };

  beforeAll(async () => {
    const moduleBuilder = Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
        {
          provide: CredentialsService,
          useValue: credentialsServiceMock,
        },
        {
          provide: SessionService,
          useValue: sessionServiceMock,
        },
        {
          provide: GoogleAuthService,
          useValue: googleAuthServiceMock,
        },
      ],
    });

    const moduleFixture: TestingModule = await moduleBuilder
      .overrideGuard(LocalAuthGuard)
      .useValue(localAuthGuardMock)
      .overrideGuard(JwtGuard)
      .useValue(jwtGuardMock)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    sessionServiceMock.login.mockResolvedValue({
      access_token: "access-token",
      userid: "user-id",
    });

    sessionServiceMock.refresh.mockImplementation(async (req: any) => {
      const cookie = req.headers?.cookie as string | undefined;
      if (!cookie || !cookie.includes("refresh_token=")) {
        throw new UnauthorizedException("Refresh token not found");
      }
      return { access_token: "new-access-token" };
    });

    authServiceMock.me.mockResolvedValue({
      id: "user-id",
      name: "Test User",
      email: "valid@example.com",
      role: "CUSTOMER",
      phone: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      emailVerifiedAt: null,
      phoneVerifiedAt: null,
      isActive: true,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it("should return 201 for valid login credentials", async () => {
    await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "valid@example.com", password: "password123" })
      .expect(201);
  });

  it("should return 401 for invalid login credentials", async () => {
    await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "valid@example.com", password: "wrong" })
      .expect(401);
  });

  it("should return 401 when refreshing without a cookie", async () => {
    await request(app.getHttpServer()).post("/auth/refresh").expect(401);
  });

  it("should refresh successfully with a valid cookie", async () => {
    await request(app.getHttpServer())
      .post("/auth/refresh")
      .set("Cookie", ["refresh_token=some-token"])
      .expect(201);
  });

  it("should return 401 when requesting the current user without a bearer token", async () => {
    await request(app.getHttpServer()).get("/auth/me").expect(401);
  });

  it("should return the current user with a valid bearer token", async () => {
    await request(app.getHttpServer())
      .get("/auth/me")
      .set("Authorization", "Bearer test-token")
      .expect(200);
  });
});
