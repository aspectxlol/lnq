import { roles } from "../../db/schema";

export interface AccessJwtPayload {
  sub: string; // User ID
  email: string;
  role: (typeof roles.enumValues)[number];
  sessionId: string; // Session ID
}

export interface RefreshJwtPayload {
  sid: string; // Session ID
}

export interface SafeUser {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  email: string;
  phone: string | null;
  role: (typeof roles.enumValues)[number];
  phoneVerifiedAt: Date | null;
  emailVerifiedAt: Date | null;
  isActive: boolean;
}
