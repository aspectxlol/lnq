import { ApiProperty } from "@nestjs/swagger";

export class LogoutResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: "Logged out successfully" })
  message!: string;

  @ApiProperty({ example: "2026-01-02T12:34:56.789Z" })
  timestamp!: string;
}
