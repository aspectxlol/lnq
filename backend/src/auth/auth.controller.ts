import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import type { FastifyReply, FastifyRequest } from "fastify";

import { AuthService } from "./auth.service";
import { LoginDto, LoginResponseDto } from "./dto/login.dto";
import { LogoutResponseDto } from "./dto/logout.dto";
import { MeResponseDto } from "./dto/me.dto";
import { RefreshResponseDto } from "./dto/refresh.dto";
import { RegisterDto, RegisterResponseDto } from "./dto/register.dto";
import { JwtGuard } from "./guards/jwt.guard";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { GoogleIdentity } from "./interfaces/google.interface";
import { GoogleAuthGuard } from "./guards/google-auth.guard";
import { CredentialsService } from "./service/credentials.service";
import { SessionService } from "./service/session.service";
import { GoogleAuthService } from "./service/google-auth.service";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authservice: AuthService,
    private readonly CredentialsService: CredentialsService,
    private readonly SessionService: SessionService,
    private readonly GoogleAuthService: GoogleAuthService,
  ) {}

  @Post("/register")
  @ApiBody({ type: RegisterDto, description: "New account attributes" })
  @ApiOperation({ summary: "Register a new user" })
  @ApiCreatedResponse({
    description: "User registered successfully",
    type: RegisterResponseDto,
  })
  @ApiBadRequestResponse({ description: "Invalid registration data" })
  @ApiConflictResponse({ description: "Email already exists" })
  register(
    @Body() registerDto: RegisterDto,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    return this.CredentialsService.register(registerDto, req, res);
  }

  @Post("/login")
  @UseGuards(LocalAuthGuard)
  @ApiBody({ type: LoginDto, description: "Credentials for login" })
  @ApiOperation({ summary: "Login with email and password" })
  @ApiOkResponse({
    description: "User logged in successfully",
    type: LoginResponseDto,
  })
  @ApiBadRequestResponse({ description: "Invalid login credentials" })
  @ApiUnauthorizedResponse({ description: "Authentication failed" })
  @ApiResponse({ status: 403, description: "Account disabled" })
  login(
    @Body() loginDto: LoginDto,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    return this.SessionService.login(req.user, req, res);
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
    return this.SessionService.refresh(req, res);
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
    return this.authservice.me(req.user);
  }

  @Post("/logout")
  @ApiOperation({ summary: "Logout the current user" })
  @ApiOkResponse({ description: "Logout successful", type: LogoutResponseDto })
  @ApiUnauthorizedResponse({
    description: "Missing or invalid refresh token cookie",
  })
  logout(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    return this.SessionService.logout(req, res);
  }

  @Get("/google")
  @UseGuards(GoogleAuthGuard)
  googleAuth() {}

  @ApiBearerAuth()
  @Get("/google/link")
  @UseGuards(JwtGuard)
  async startGoogleLink(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const state = this.GoogleAuthService.createGoogleLinkState(req.user);
    return res.redirect(`/auth/google?state=${encodeURIComponent(state)}`);
  }

  @Get("/google/callback")
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(
    @Req() req: FastifyRequest,
    @Query("state") state: string | undefined,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    return this.GoogleAuthService.handleGoogleCallback(
      req.user as GoogleIdentity,
      state,
      req,
      res,
    );
  }
}
