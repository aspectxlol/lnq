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
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
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
import { GoogleAuthGuard } from "./guards/google-auth.guard";
import { type LinkProviderDto } from "./interfaces/link.dto";
import { SafeUser } from "./interfaces/jwt.interface";
import { GoogleProfileData } from "./interfaces/google.interface";
import { AuthUser } from "./interfaces/auth-user.interface";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(private readonly authservice: AuthService) {}

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
    return this.authservice.register(registerDto, req, res);
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
    return this.authservice.logout(req, res);
  }

  @Get("/google")
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: "Redirect to Google for authentication" })
  @ApiOkResponse({
    description: "Redirects to Google OAuth consent screen",
  })
  googleAuth() {}

  @ApiBearerAuth()
  @Get("/google/link")
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: "Start linking Google with the current account" })
  @ApiOkResponse({ description: "Redirects to Google with linking state" })
  async linkGoogleAccountStart(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    const user = req.user as SafeUser;
    const state = this.authservice.createGoogleLinkState(user);
    return res.redirect(`/auth/google?state=${encodeURIComponent(state)}`);
  }

  @Get("/google/callback")
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: "Handle Google OAuth callback" })
  @ApiOkResponse({
    description: "Returns access token and user info on successful login",
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 200,
    description: "Links Google account when state is provided",
  })
  @ApiUnauthorizedResponse({
    description: "Google profile missing required data or verification failed",
  })
  async googleAuthCallback(
    @Req() req: FastifyRequest,
    @Query("state") state: string | undefined,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const googleUser = req.user as AuthUser & GoogleProfileData;

    if (state) {
      const targetUserId = this.authservice.verifyGoogleLinkState(state);
      const safeUser = await this.authservice.getSafeUserForLink(targetUserId);
      await this.authservice.linkGoogleAccount("GOOGLE", safeUser, {
        providerAccountId: googleUser.providerAccountId,
        email: googleUser.email,
        name: googleUser.name,
      });
      return { message: "Google account linked" };
    }

    return this.authservice.login(googleUser, req, res);
  }

  @ApiBearerAuth()
  @Post("/google/link")
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: "Link Google account to current user" })
  @ApiBody({
    description: "The Google provider account to associate",
    schema: {
      type: "object",
      properties: {
        providerAccountId: { type: "string" },
        name: { type: "string", nullable: true },
        email: { type: "string", nullable: true },
      },
      required: ["providerAccountId"],
    },
  })
  async linkGoogleAccount(
    @Req() req: FastifyRequest,
    @Body() linkDto: LinkProviderDto,
  ) {
    return this.authservice.linkGoogleAccount("GOOGLE", req.user, linkDto);
  }
}
