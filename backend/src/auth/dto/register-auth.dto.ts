import { ApiProperty } from "@nestjs/swagger";

export class RegisterAuthDto {
  @ApiProperty({ example: "John", description: "User first name" })
  firstName: string;

  @ApiProperty({
    example: "Doe",
    description: "User last name",
    required: false,
  })
  lastName?: string;

  @ApiProperty({
    example: "+1234567890",
    description: "Phone number",
    required: false,
  })
  phone?: string;

  @ApiProperty({ example: "john@example.com", description: "Email address" })
  email: string;

  @ApiProperty({ example: "strongPassword123", description: "Password" })
  password: string;
}
