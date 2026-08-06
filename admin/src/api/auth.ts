import {
  type LoginInput,
  type LoginResponse,
  type LogoutResponse,
  type MeResponse,
  type RefreshResponse,
  type RegisterInput,
} from "@lnq/shared";

import { api } from "./client";

export async function register(payload: RegisterInput) {
  const response = await api.post<LoginResponse>("/auth/register", payload);
  return response.data;
}

export async function login(payload: LoginInput) {
  const response = await api.post<LoginResponse>("/auth/login", payload);
  return response.data;
}

export async function refresh() {
  const response = await api.post<RefreshResponse>("/auth/refresh");
  return response.data;
}

export async function me() {
  const response = await api.get<MeResponse>("/auth/me");
  return response.data;
}

export async function logout() {
  const response = await api.post<LogoutResponse>("/auth/logout");
  return response.data;
}
