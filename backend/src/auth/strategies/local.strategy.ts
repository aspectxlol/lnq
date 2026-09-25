import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";

import { CredentialsService } from "../service/credentials.service";
import { AuthUser } from "../interfaces/auth-user.interface";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly CredentialsService: CredentialsService) {
    super({
      usernameField: "email",
      passwordField: "password",
    });
  }

  async validate(email: string, password: string): Promise<AuthUser | null> {
    return this.CredentialsService.validateUser(email, password);
  }
}
