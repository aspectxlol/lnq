import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { PassportModule } from "@nestjs/passport";
/*
https://docs.nestjs.com/modules
*/

import { Module } from "@nestjs/common";
import { LocalStrategy } from "./strategies/local.strategy";

@Module({
  imports: [PassportModule],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy],
})
export class AuthModule {}
