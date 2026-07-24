import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { type Request } from "express";
import { AuthService } from "./auth.service";
import { LoginAuthDto } from "./dto/login-auth.dto";
import { RegisterAuthDto } from "./dto/register-auth.dto";
import { GoogleAuthGuard } from "./guards/google-auth.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { LocalAuthGuard } from "./guards/local-auth.guard";

type AuthenticatedRequest = Request & {
  user?: unknown;
};

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @ApiOperation({ summary: "Register a new local user" })
  @ApiBody({ type: RegisterAuthDto })
  @ApiResponse({ status: 201, description: "Registration successful" })
  async register(@Body() dto: RegisterAuthDto) {
    const authResponse = await this.authService.registerLocal(dto);
    return {
      message: "Registration successful",
      ...authResponse,
    };
  }

  @Post("login")
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: "Log in with email and password" })
  @ApiBody({ type: LoginAuthDto })
  @ApiResponse({ status: 201, description: "Login successful" })
  async login(@Req() req: AuthenticatedRequest) {
    if (!req.user) {
      return { success: false, message: "Login failed" };
    }

    const authResponse = req.user as
      | { accessToken?: string; refreshToken?: string; user?: unknown }
      | undefined;

    return {
      success: true,
      accessToken: authResponse?.accessToken,
      refreshToken: authResponse?.refreshToken,
      user: authResponse?.user,
    };
  }

  @Get("google")
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: "Start Google OAuth login" })
  googleAuth() {
    return { message: "Redirecting to Google" };
  }

  @Get("google/callback")
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: "Handle Google OAuth callback" })
  googleAuthCallback(@Req() req: AuthenticatedRequest) {
    return {
      message: "Google authentication successful",
      ...(req.user as { accessToken?: string; user?: unknown } | undefined),
    };
  }

  @Post("refresh")
  @ApiOperation({ summary: "Refresh an access token" })
  @ApiResponse({ status: 201, description: "Token refreshed" })
  async refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refreshAccessToken(body.refreshToken);
  }

  @Post("logout")
  @ApiOperation({ summary: "Log out the current user" })
  @ApiResponse({ status: 201, description: "Logged out" })
  async logout(@Body() body: { refreshToken?: string }) {
    return this.authService.logout(body.refreshToken);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get the authenticated user" })
  me(@Req() req: AuthenticatedRequest) {
    return req.user ?? null;
  }
}
