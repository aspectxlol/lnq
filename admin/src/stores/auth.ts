import {
  type LoginInput,
  type RegisterInput,
  type UserModel,
} from "@lnq/shared";
import { jwtDecode } from "jwt-decode";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

import * as authApi from "../api/auth";

export const useAuthStore = defineStore("auth", () => {
  const accessToken = ref<string | null>(null);
  const user = ref<UserModel | null>(null);
  const pendingRequests = ref(0);
  const loading = computed(() => pendingRequests.value > 0);
  let refreshTimer: ReturnType<typeof setTimeout> | null = null;

  const isAuthenticated = computed(() => !!accessToken.value);

  function beginRequest() {
    pendingRequests.value += 1;
  }

  function endRequest() {
    pendingRequests.value = Math.max(0, pendingRequests.value - 1);
  }

  async function withLoading<T>(fn: () => Promise<T>): Promise<T> {
    beginRequest();

    try {
      return await fn();
    } finally {
      endRequest();
    }
  }

  async function initialize() {
    await refresh();
  }

  function scheduleRefresh(token: string) {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
    }

    const decodedToken = jwtDecode<{ exp?: number }>(token);
    const expiresAt = decodedToken.exp;

    if (typeof expiresAt !== "number") {
      return;
    }

    const delay = expiresAt * 1000 - Date.now() - 60_000;
    const timeoutDelay = Math.max(1_000, delay);

    refreshTimer = setTimeout(() => {
      refreshTimer = null;
      void refresh();
    }, timeoutDelay);
  }

  async function authenticate(fn: () => Promise<{ access_token: string }>) {
    return withLoading(async () => {
      const result = await fn();
      accessToken.value = result.access_token;
      scheduleRefresh(result.access_token);

      await fetchCurrentUser();

      return true;
    });
  }

  async function login(payload: LoginInput) {
    return authenticate(() => authApi.login(payload));
  }

  async function fetchCurrentUser() {
    user.value = await authApi.me();
  }

  async function register(payload: RegisterInput) {
    return authenticate(() => authApi.register(payload));
  }

  async function refresh() {
    return withLoading(async () => {
      try {
        const result = await authApi.refresh();

        accessToken.value = result.access_token;
        scheduleRefresh(result.access_token);

        await fetchCurrentUser();

        return true;
      } catch (error) {
        clear();
        throw error;
      }
    });
  }

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      clear();
    }
  }

  function clear() {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
      refreshTimer = null;
    }

    user.value = null;
    accessToken.value = null;
    pendingRequests.value = 0;
  }

  return {
    initialize,

    accessToken,
    user,
    loading,

    isAuthenticated,

    login,
    register,
    refresh,
    logout,

    clear,
  };
});
