import { INestApplication, UnauthorizedException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";

import { AuthController } from "../../auth/auth.controller";
import { AuthService } from "../../auth/auth.service";
import { JwtGuard } from "../../auth/guards/jwt.guard";
import { LocalAuthGuard } from "../../auth/guards/local-auth.guard";

describe("AuthController (e2e)", () => {
  let app: INestApplication;

  const authServiceMock = {
    login: jest.fn(),
    refresh: jest.fn(),
    me: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    linkGoogleAccount: jest.fn(),
    createGoogleLinkState: jest.fn(),
    verifyGoogleLinkState: jest.fn(),
    getSafeUserForLink: jest.fn(),
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

    authServiceMock.login.mockResolvedValue({
      access_token: "access-token",
      userid: "user-id",
    });

    authServiceMock.refresh.mockImplementation(async (req: any) => {
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

  it("POST /auth/login returns 201 for valid credentials", async () => {
    await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "valid@example.com", password: "password123" })
      .expect(201);
  });

  it("POST /auth/login returns 401 for invalid credentials", async () => {
    await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "valid@example.com", password: "wrong" })
      .expect(401);
  });

  it("POST /auth/refresh returns 401 without refresh cookie", async () => {
    await request(app.getHttpServer()).post("/auth/refresh").expect(401);
  });

  it("POST /auth/refresh returns 201 with refresh cookie", async () => {
    await request(app.getHttpServer())
      .post("/auth/refresh")
      .set("Cookie", ["refresh_token=some-token"])
      .expect(201);
  });

  it("GET /auth/me returns 401 without bearer token", async () => {
    await request(app.getHttpServer()).get("/auth/me").expect(401);
  });

  it("GET /auth/me returns 200 with bearer token", async () => {
    await request(app.getHttpServer())
      .get("/auth/me")
      .set("Authorization", "Bearer test-token")
      .expect(200);
  });
});
