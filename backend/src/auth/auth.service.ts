import type {
  LoginResponse,
  LogoutResponse,
  MeResponse,
  RefreshResponse,
  RegisterInput,
} from "@lnq/shared";
import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { FastifyReply, FastifyRequest } from "fastify";
import * as RefreshJwt from "jsonwebtoken";

import {
  AccountRepository,
  SessionRepository,
  UserRepository,
} from "../repositories/auth";
import { DAYSINSECONDS } from "../utils";
import { AuthUser } from "./interfaces/auth-user.interface";
import type {
  AccessJwtPayload,
  RefreshJwtPayload,
  SafeUser,
} from "./interfaces/jwt.interface";
import { AuthProvider } from "../db/schema";
import { LinkProviderDto } from "./interfaces/link.dto";
import { GoogleIdentity } from "./interfaces/google.interface";

@Injectable()
export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  async me(user: AuthUser): Promise<MeResponse> {
    const dbUser = await this.userRepository.findById(user.id);
    if (!dbUser) throw new UnauthorizedException("User not found");
    if (!dbUser.isActive) throw new UnauthorizedException("User is inactive");

    return {
      id: dbUser.id,

      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      phone: dbUser.phone,

      createdAt: dbUser.createdAt,
      emailVerifiedAt: dbUser.emailVerifiedAt,
      phoneVerifiedAt: dbUser.phoneVerifiedAt,
      updatedAt: dbUser.updatedAt,
      isActive: dbUser.isActive,
    };
  }
}
