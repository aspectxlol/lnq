/*
https://docs.nestjs.com/controllers#controllers
*/

import { Body, Controller, Post, UseGuards, Req, Get } from "@nestjs/common";
import { RegisterDto } from "./dto/register.dto";
import { AuthService } from "./auth.service";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import type { FastifyRequest } from "fastify";
import { RefreshDto } from "./dto/refresh.dto";
import { JwtGuard } from "./guards/jwt.guard";

@Controller()
export class AuthController {
  constructor(private readonly authservice: AuthService) {}

  @Post("/register")
  register(@Body() registerDto: RegisterDto) {
    return this.authservice.register(registerDto);
  }

  @Post("/login")
  @UseGuards(LocalAuthGuard)
  login(@Req() req: FastifyRequest) {
    return this.authservice.login(req.user, req);
  }

  @Post("/refresh")
  refresh(@Body() body: RefreshDto) {
    return this.authservice.refresh(body);
  }

  @Get("/me")
  @UseGuards(JwtGuard)
  me(@Req() req: FastifyRequest) {
    return req.user;
  }
}
