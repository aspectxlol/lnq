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
import { UserRepository } from "../../repositories/auth";
import { AccountRepository } from "../../repositories/auth/accounts.repository";
import { AuthUser } from "../interfaces/auth-user.interface";
import { SessionService } from "./session.service";

@Injectable()
export class CredentialsService {
  private readonly logger: Logger = new Logger(CredentialsService.name);
  private readonly dummyPasswordHash =
    "$2a$12$gTStWrVLvBgHg8V8W6db7uaA3VY9kiHpKscpUhBJBL8zRoLuqeVpC";
  constructor(
    // private readonly drizzle: DrizzleService,
    private readonly userRepository: UserRepository,
    private readonly SessionService: SessionService,
  ) {}

  async register(
    registerDto: RegisterInput,
    req: FastifyRequest,
    res: FastifyReply,
  ): Promise<LoginResponse> {
    if (await this.userRepository.findByEmail(registerDto.email)) {
      throw new ConflictException("Email already exists");
    }

    const hash = await bcrypt.hash(registerDto.password, 10);
    const user = await this.userRepository.create({
      name: registerDto.name,
      email: registerDto.email,
      passwordHash: hash,
    });

    const authUser: AuthUser = {
      email: user.email,
      id: user.id,
      role: user.role,
    };

    return this.SessionService.login(authUser, req, res);
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<AuthUser | null> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      await bcrypt.compare(password, this.dummyPasswordHash);
      return null;
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash!);

    if (!passwordValid) {
      return null;
    }

    if (!user.isActive) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
