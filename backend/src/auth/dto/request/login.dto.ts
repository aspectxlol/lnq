import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
  @ApiProperty({
    example: "john@example.com",
    description: "User's email address",
  })
  email!: string;

  @ApiProperty({
    example: "MySuperSecurePassword123!",
    description: "User's password",
  })
  password!: string;
}
