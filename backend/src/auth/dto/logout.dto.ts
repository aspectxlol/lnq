import { logoutResponseSchema } from "@lnq/shared";
import { createZodDto } from "nestjs-zod";

export class LogoutResponseDto extends createZodDto(logoutResponseSchema) {}
