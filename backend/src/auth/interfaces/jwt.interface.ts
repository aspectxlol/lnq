import { Role } from "@prisma/client";

export interface AccessJwtPayload {
  sub: number; // User ID
  email: string;
  role: Role;
  sessionId: number; // Session ID
}

export interface RefreshJwtPayload {
  sid: number; // Session ID
}

export interface SafeUser {
  id: number;
  createdAt: Date;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  emailVerified: boolean;
  isActive: boolean;
  inviteId: number | null;
  updatedAt: Date;
}
