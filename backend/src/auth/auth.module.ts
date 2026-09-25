/*
https://docs.nestjs.com/modules
*/
import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";

import { RepositoryModule } from "../repositories/repository.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { LocalStrategy } from "./strategies/local.strategy";
import { GoogleStrategy } from "./strategies/google.strategy";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { SessionService } from "./service/session.service";
import { CredentialsService } from "./service/credentials.service";
import { GoogleAuthService } from "./service/google-auth.service";

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
      signOptions: { expiresIn: "15m" },
    }),
    RepositoryModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    CredentialsService,
    SessionService,
    GoogleAuthService,
    GoogleStrategy,
    JwtStrategy,
  ],
})
export class AuthModule {}
