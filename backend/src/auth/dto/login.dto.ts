import { loginResponseSchema, loginSchema } from "@lnq/shared";
import { createZodDto } from "nestjs-zod";

export class LoginDto extends createZodDto(loginSchema) {}
export class LoginResponseDto extends createZodDto(loginResponseSchema) {}
