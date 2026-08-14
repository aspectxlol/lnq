import "fastify";
import "@fastify/cookie";

import type { AuthUser } from "../auth/types/auth-user";

declare module "fastify" {
  interface FastifyRequest {
    user: AuthUser;
    cookies: Record<string, string>;
  }

  interface FastifyReply {
    setCookie(name: string, value: string, opts?: any): FastifyReply;
    clearCookie(name: string, opts?: any): FastifyReply;
  }
}
