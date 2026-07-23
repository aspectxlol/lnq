import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { type Request } from 'express';
import { AuthService } from './auth.service';
import { type RegisterAuthDto } from './dto/register-auth.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';

type AuthenticatedRequest = Request & {
  user?: unknown;
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterAuthDto) {
    const user = await this.authService.registerLocal(dto);
    return {
      message: 'Registration successful',
      user,
    };
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  login(@Req() req: AuthenticatedRequest) {
    return {
      message: 'Login successful',
      user: req.user,
    };
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {
    return { message: 'Redirecting to Google' };
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  googleAuthCallback(@Req() req: AuthenticatedRequest) {
    return {
      message: 'Google authentication successful',
      user: req.user,
    };
  }

  @Get('me')
  async me(@Req() req: AuthenticatedRequest) {
    return req.user ?? null;
  }
}
