export type UserRole = 'CUSTOMER' | 'STAFF' | 'OWNER' | 'ADMIN';

export interface SafeUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;

  isActive: boolean;

  createdAt: string;
  updatedAt: string;
}
