import { loginResponseSchema, registerSchema } from "@lnq/shared";
import { createZodDto } from "nestjs-zod";
export class RegisterDto extends createZodDto(registerSchema) {}
export class RegisterResponseDto extends createZodDto(loginResponseSchema) {}
