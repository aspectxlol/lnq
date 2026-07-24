import { ApiProperty } from "@nestjs/swagger";

export class LoginAuthDto {
  @ApiProperty({
    example: "john@example.com",
    description: "Email address used to sign in",
  })
  email: string;

  @ApiProperty({ example: "strongPassword123", description: "Password" })
  password: string;
}
