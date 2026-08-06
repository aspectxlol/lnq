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
  const response = await api.post("/auth/register", payload);
  return response.data as LoginResponse;
}

export async function login(payload: LoginInput) {
  const response = await api.post("/auth/login", payload);
  return response.data as LoginResponse;
}

export async function refresh() {
  const response = await api.post("/auth/refresh");
  return response.data as RefreshResponse;
}

export async function me() {
  const response = await api.get("/auth/me");
  return response.data as MeResponse;
}

export async function logout() {
  const response = await api.post("/auth/logout");
  return response.data as LogoutResponse;
}
