import { UnauthorizedException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { Profile } from "passport-google-oauth20";
import { GoogleStrategy } from "../../auth/strategies/google.strategy";
import { GoogleAuthService } from "../../auth/service/google-auth.service";

describe("GoogleStrategy", () => {
  let strategy: GoogleStrategy;

  beforeAll(() => {
    process.env.GOOGLE_CLIENT_ID = "test-client-id";
    process.env.GOOGLE_CLIENT_SECRET = "test-client-secret";
    process.env.GOOGLE_CALLBACK_URL = "http://localhost/auth/google/callback";
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GoogleStrategy, { provide: GoogleAuthService, useValue: {} }],
    }).compile();

    strategy = module.get<GoogleStrategy>(GoogleStrategy);
  });

  it("should reject profiles without an email", async () => {
    const done = jest.fn();
    const profile = {
      id: "google-id",
      displayName: "Test User",
      emails: undefined,
    } as Profile;

    await strategy.validate("access-token", "refresh-token", profile, done);

    expect(done).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Google profile has no email" }),
    );
  });

  it("should resolve a validated Google user", async () => {
    const done = jest.fn();
    const profile = {
      id: "google-id",
      displayName: "Test User",
      emails: [{ value: "test@example.com", verified: true }],
    } as Profile;

    await strategy.validate("access-token", "refresh-token", profile, done);

    expect(done).toHaveBeenCalledWith(null, {
      providerAccountId: "google-id",
      email: "test@example.com",
      name: "Test User",
      emailVerified: true,
    });
  });
});
