import { ApiProperty } from "@nestjs/swagger";

export class LoginResponseDto {
  @ApiProperty({ example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." })
  access_token!: string;

  @ApiProperty({ example: "b4b1f0d2-3c2e-4f5a-9a1e-0a1b2c3d4e5f" })
  userid!: string;
}
