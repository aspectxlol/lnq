import { ApiProperty } from "@nestjs/swagger";

export class MeResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: "b4b1f0d2-3c2e-4f5a-9a1e-0a1b2c3d4e5f" })
  id!: string;

  @ApiProperty({ example: "2026-01-01T00:00:00.000Z" })
  createdAt!: Date;

  @ApiProperty({ example: "2026-01-02T00:00:00.000Z" })
  updatedAt!: Date;

  @ApiProperty({ example: "John Doe" })
  name!: string;

  @ApiProperty({ example: "john@example.com" })
  email!: string;

  @ApiProperty({ example: null })
  phone!: string | null;

  @ApiProperty({ example: "admin" })
  role!: string;

  @ApiProperty({ example: null })
  phoneVerifiedAt!: Date | null;

  @ApiProperty({ example: null })
  emailVerifiedAt!: Date | null;

  @ApiProperty({ example: true })
  isActive!: boolean;
}
