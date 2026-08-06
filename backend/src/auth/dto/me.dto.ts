import { meResponseSchema } from "@lnq/shared";
import { createZodDto } from "nestjs-zod";

export class MeResponseDto extends createZodDto(meResponseSchema) {}
