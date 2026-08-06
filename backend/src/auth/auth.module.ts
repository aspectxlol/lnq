/*
https://docs.nestjs.com/modules
*/
import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt/dist/jwt.module";
import { PassportModule } from "@nestjs/passport";

import { RepositoryModule } from "../repositories/repository.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { LocalStrategy } from "./strategies/local.strategy";

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
  providers: [AuthService, LocalStrategy],
})
export class AuthModule {}
