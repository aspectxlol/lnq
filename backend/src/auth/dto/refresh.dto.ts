import { refreshResponseSchema } from "@lnq/shared";
import { createZodDto } from "nestjs-zod";

export class RefreshResponseDto extends createZodDto(refreshResponseSchema) {}
