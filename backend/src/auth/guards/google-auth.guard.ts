import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { FastifyRequest } from "fastify";

@Injectable()
export class GoogleAuthGuard extends AuthGuard("google") {}
