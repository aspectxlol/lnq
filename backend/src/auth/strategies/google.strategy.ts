import { Injectable, UnauthorizedException } from "@nestjs/common";
import { Profile, Strategy, VerifyCallback } from "passport-google-oauth20";
import { GoogleAuthService } from "../service/google-auth.service";
import { PassportStrategy } from "@nestjs/passport";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(private readonly GoogleAuthService: GoogleAuthService) {
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
    const googleEmail = profile.emails?.[0];

    if (!googleEmail?.value) {
      return done(new UnauthorizedException("Google profile has no email"));
    }

    if (googleEmail.verified !== true) {
      return done(new UnauthorizedException("Google email is not verified"));
    }

    return done(null, {
      providerAccountId: profile.id,
      email: googleEmail.value,
      name: profile.displayName,
      emailVerified: true,
    });
  }
}
