import { ApiProperty } from "@nestjs/swagger";

export class RegisterDto {
  @ApiProperty({
    example: "John Doe",
    name: "user's password",
  })
  name!: string;
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
