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
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
} from "@nestjs/swagger";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(private readonly authservice: AuthService) {}

  @Post("/register")
  @ApiOperation({ summary: "Register a new user" })
  @ApiCreatedResponse({ description: "User registered successfully" })
  @ApiBadRequestResponse({ description: "Invalid registration data" })
  @ApiConflictResponse({ description: "Email already exists" })
  register(
    @Body() registerDto: RegisterDto,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    return this.authservice.register(registerDto, req, res);
  }

  @Post("/login")
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: "Login with email and password" })
  @ApiOkResponse({ description: "User logged in successfully" })
  @ApiBadRequestResponse({ description: "Invalid login credentials" })
  @ApiUnauthorizedResponse({ description: "Authentication failed" })
  login(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    return this.authservice.login(req.user, req, res);
  }

  @Post("/refresh")
  @ApiOperation({ summary: "Refresh access token" })
  @ApiOkResponse({ description: "Tokens refreshed successfully" })
  @ApiUnauthorizedResponse({ description: "Invalid or expired refresh token" })
  refresh(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    return this.authservice.refresh(req, res);
  }

  @ApiBearerAuth()
  @Get("/me")
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: "Get current authenticated user" })
  @ApiOkResponse({ description: "Authenticated user profile returned" })
  @ApiUnauthorizedResponse({ description: "Missing or invalid token" })
  @ApiNotFoundResponse({ description: "Authenticated user not found" })
  me(@Req() req: FastifyRequest) {
    return req.user;
  }

  @Get("/logout")
  @ApiOperation({ summary: "Logout the current user" })
  @ApiOkResponse({ description: "Logout successful" })
  logout(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    return this.authservice.logout(req, res);
  }
}
