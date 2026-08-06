import { type LoginInput } from "@lnq/shared";
import { defineStore } from "pinia";
import { ref } from "vue";

import { login as loginApi } from "../api/auth";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<{ userid: string } | null>(null);
  const loading = ref(false);
  const accessToken = ref<string | null>(null);

  async function login(payload: LoginInput) {
    loading.value = true;
    try {
      const response = await loginApi(payload);
      accessToken.value = response.access_token;
      user.value = { userid: response.userid };
      return response.success;
    } finally {
      loading.value = false;
    }
  }

  function register() {
    throw new Error("Not implemented");
  }

  function refresh() {
    throw new Error("Not implemented");
  }

  function clear() {
    user.value = null;
    accessToken.value = null;
    loading.value = false;
  }

  return {
    user,
    loading,
    accessToken,
    register,
    login,
    refresh,
    clear,
  };
});
