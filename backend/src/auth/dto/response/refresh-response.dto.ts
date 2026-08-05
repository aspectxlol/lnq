import { ApiProperty } from "@nestjs/swagger";

export class RefreshResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." })
  access_token!: string;
}
