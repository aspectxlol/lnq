import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

import { useAuthStore } from "@/stores/auth";

let refreshPromise: Promise<boolean> | null = null;

export const api = axios.create({
  baseURL: "http://localhost:3001",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const auth = useAuthStore();

  if (auth.accessToken) {
    config.headers.set?.("Authorization", `Bearer ${auth.accessToken}`);
    // or:
    config.headers.Authorization = `Bearer ${auth.accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const auth = useAuthStore();

    const originalRequest = error.config as InternalAxiosRequestConfig;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = auth.refresh().finally(() => {
            refreshPromise = null;
          });
        }

        await refreshPromise;

        return api(originalRequest);
      } catch {
        auth.clear();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);
