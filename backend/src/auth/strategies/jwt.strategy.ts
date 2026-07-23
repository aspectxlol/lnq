import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy as JwtStrategyBase } from "passport-jwt";
import { AuthService } from "../auth.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(JwtStrategyBase, "jwt") {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || "dev-secret",
    });
  }

  async validate(payload: { sub: string; email?: string }) {
    const user = await this.authService.getAuthenticatedUser(payload.sub);
    if (!user) {
      return null;
    }

    return user;
  }
}
