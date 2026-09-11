import { Injectable, UnauthorizedException } from "@nestjs/common";
import { Profile, Strategy, VerifyCallback } from "passport-google-oauth20";
import { AuthService } from "../auth.service";
import { PassportStrategy } from "@nestjs/passport";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ["openid", "email", "profile"],
    });
  }

  authorizationParams(
    options: Record<string, unknown>,
  ): Record<string, unknown> {
    return {
      ...options,
      access_type: "offline",
      prompt: "consent",
    };
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      return done(new UnauthorizedException("Google profile has no email"));
    }

    const authUser = await this.authService.validateGoogleUser(
      profile.id,
      email,
      profile.displayName,
    );
    return done(null, {
      ...authUser,
      providerAccountId: profile.id,
      email,
      name: profile.displayName,
    });
  }
}
