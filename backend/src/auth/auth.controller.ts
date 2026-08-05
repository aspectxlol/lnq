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
import { RegisterDto } from "./dto/request/register.dto";
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
import { LoginResponseDto } from "./dto/response/login-response.dto";
import { RefreshResponseDto } from "./dto/response/refresh-response.dto";
import { MeResponseDto } from "./dto/response/me-response.dto";
import { LogoutResponseDto } from "./dto/response/logout-response.dto";
import { LoginDto } from "./dto/request/login.dto";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(private readonly authservice: AuthService) {}

  @Post("/register")
  @ApiOperation({ summary: "Register a new user" })
  @ApiCreatedResponse({
    description: "User registered successfully",
    type: LoginResponseDto,
  })
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
  @ApiOkResponse({
    description: "User logged in successfully",
    type: LoginResponseDto,
  })
  @ApiBadRequestResponse({ description: "Invalid login credentials" })
  @ApiUnauthorizedResponse({ description: "Authentication failed" })
  login(
    @Body() loginDto: LoginDto,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    return this.authservice.login(req.user, req, res);
  }

  @Post("/refresh")
  @ApiOperation({ summary: "Refresh access token" })
  @ApiOkResponse({
    description: "Tokens refreshed successfully",
    type: RefreshResponseDto,
  })
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
  @ApiOkResponse({
    description: "Authenticated user profile returned",
    type: MeResponseDto,
  })
  @ApiUnauthorizedResponse({ description: "Missing or invalid token" })
  @ApiNotFoundResponse({ description: "Authenticated user not found" })
  me(@Req() req: FastifyRequest) {
    return req.user;
  }

  @Post("/logout")
  @ApiOperation({ summary: "Logout the current user" })
  @ApiOkResponse({ description: "Logout successful", type: LogoutResponseDto })
  logout(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    return this.authservice.logout(req, res);
  }
}
