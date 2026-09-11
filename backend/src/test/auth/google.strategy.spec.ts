import { UnauthorizedException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { Profile } from "passport-google-oauth20";
import { GoogleStrategy } from "../../auth/strategies/google.strategy";
import { AuthService } from "../../auth/auth.service";
import { AuthUser } from "../../auth/interfaces/auth-user.interface";

describe("GoogleStrategy", () => {
  let strategy: GoogleStrategy;
  let authService: jest.Mocked<AuthService>;

  beforeAll(() => {
    process.env.GOOGLE_CLIENT_ID = "test-client-id";
    process.env.GOOGLE_CLIENT_SECRET = "test-client-secret";
    process.env.GOOGLE_CALLBACK_URL = "http://localhost/auth/google/callback";
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleStrategy,
        {
          provide: AuthService,
          useValue: {
            validateGoogleUser: jest.fn(),
          },
        },
      ],
    }).compile();

    strategy = module.get<GoogleStrategy>(GoogleStrategy);
    authService = module.get(AuthService);

    jest.clearAllMocks();
  });

  it("should reject profiles without an email", async () => {
    const done = jest.fn();
    const profile = {
      id: "google-id",
      displayName: "Test User",
      emails: undefined,
    } as Profile;

    await strategy.validate("access-token", "refresh-token", profile, done);

    expect(authService.validateGoogleUser).not.toHaveBeenCalled();
    expect(done).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Google profile has no email" }),
    );
  });

  it("should resolve a validated Google user", async () => {
    const done = jest.fn();
    const profile = {
      id: "google-id",
      displayName: "Test User",
      emails: [{ value: "test@example.com" }],
    } as Profile;
    const authUser = {
      id: "user-id",
      email: "test@example.com",
      role: "CUSTOMER",
    } as AuthUser;
    authService.validateGoogleUser.mockResolvedValue(authUser);

    await strategy.validate("access-token", "refresh-token", profile, done);

    expect(authService.validateGoogleUser).toHaveBeenCalledWith(
      "google-id",
      "test@example.com",
      "Test User",
    );
    expect(done).toHaveBeenCalledWith(null, {
      ...authUser,
      providerAccountId: "google-id",
      email: "test@example.com",
      name: "Test User",
    });
  });
});
