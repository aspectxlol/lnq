import type { SafeUser } from './user.dto';
export interface RegisterDto {
  name: string;
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterResponse {
  access_token: string;
  userid: number;
}

export interface LoginResponse {
  access_token: string;
  userid: number;
}

export interface RefreshResponse {
  access_token: string;
}

export interface LogoutResponse {
  message: string;
  timestamp: string;
}

export type MeResponse = SafeUser;
