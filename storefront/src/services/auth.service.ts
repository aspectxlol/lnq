import type {
  LoginResponse,
  LogoutResponse,
  MeResponse,
  RegisterResponse,
  LoginDto,
  RefreshResponse,
  RegisterDto,
} from '@/types/auth.dto';
import api from '../api/client';

export function register(payload: RegisterDto) {
  return api.post<RegisterResponse>(`/auth/register`, payload);
}

export function login(payload: LoginDto) {
  return api.post<LoginResponse>('/auth/login', payload);
}

export function refresh() {
  return api.post<RefreshResponse>('/auth/refresh');
}

export function logout() {
  return api.post<LogoutResponse>('/auth/logout');
}

export function me() {
  return api.get<MeResponse>('/auth/me');
}
