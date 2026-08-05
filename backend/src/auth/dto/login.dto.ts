import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
  @ApiProperty({
    example: "john@example.com",
    name: "user's email",
  })
  email!: string;
  @ApiProperty({
    example: "MySuperSecurePassword123!",
    name: "user's password",
  })
  password!: string;
}
