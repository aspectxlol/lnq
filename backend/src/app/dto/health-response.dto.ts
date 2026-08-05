import { ApiProperty } from "@nestjs/swagger";

export class HealthResponseDto {
  @ApiProperty({ example: 200 })
  status!: number;

  @ApiProperty({ example: "ok" })
  message!: string;

  @ApiProperty({ example: "ok", required: false })
  database?: string;
}
