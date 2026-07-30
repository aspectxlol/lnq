/*
https://docs.nestjs.com/controllers#controllers
*/

import {
  Body,
  Controller,
  Post,
  UseGuards,
  Req,
  Get,
  Res,
} from "@nestjs/common";
import { RegisterDto } from "./dto/register.dto";
import { AuthService } from "./auth.service";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import type { FastifyReply, FastifyRequest } from "fastify";
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
  login(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    return this.authservice.login(req.user, req, res);
  }

  @Post("/refresh")
  refresh(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    return this.authservice.refresh(req, res);
  }

  @Get("/me")
  @UseGuards(JwtGuard)
  me(@Req() req: FastifyRequest) {
    return req.user;
  }

  @Get("/test")
  test(@Req() req: FastifyRequest) {
    return {
      message: "This is a test endpoint",
    };
  }
}
