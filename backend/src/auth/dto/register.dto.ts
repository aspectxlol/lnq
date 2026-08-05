import { ApiProperty } from "@nestjs/swagger";

export class RegisterDto {
  @ApiProperty({
    example: "John Doe",
    description: "Full name of the user",
  })
  name!: string;

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
