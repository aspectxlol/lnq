import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { type Request } from "express";
import { AuthService } from "./auth.service";
import { type RegisterAuthDto } from "./dto/register-auth.dto";
import { GoogleAuthGuard } from "./guards/google-auth.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { LocalAuthGuard } from "./guards/local-auth.guard";

type AuthenticatedRequest = Request & {
  user?: unknown;
};

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  async register(@Body() dto: RegisterAuthDto) {
    const authResponse = await this.authService.registerLocal(dto);
    return {
      message: "Registration successful",
      ...authResponse,
    };
  }

  @Post("login")
  @UseGuards(LocalAuthGuard)
  async login(@Req() req: AuthenticatedRequest) {
    if (!req.user) {
      return { message: "Login failed" };
    }

    return req.user;
  }

  @Get("google")
  @UseGuards(GoogleAuthGuard)
  googleAuth() {
    return { message: "Redirecting to Google" };
  }

  @Get("google/callback")
  @UseGuards(GoogleAuthGuard)
  googleAuthCallback(@Req() req: AuthenticatedRequest) {
    return {
      message: "Google authentication successful",
      ...(req.user as { accessToken?: string; user?: unknown } | undefined),
    };
  }

  @Post("refresh")
  async refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refreshAccessToken(body.refreshToken);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@Req() req: AuthenticatedRequest) {
    return req.user ?? null;
  }
}
