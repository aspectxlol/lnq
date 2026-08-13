<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";

import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const router = useRouter();

const email = ref("");
const password = ref("");
const error = ref<string | null>(null);
const loading = ref(false);

const onSubmit = async () => {
  error.value = null;
  loading.value = true;

  try {
    const success = await auth.login({ email: email.value, password: password.value });
    if (success) {
      router.push("/");
    } else {
      error.value = "Login failed. Check your email and password.";
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err)
    error.value = "Unable to sign in. Please try again.";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <main class="login-page">
    <section class="login-card">
      <div class="login-header">
        <h1>Admin Login</h1>
        <p>Sign in to access the dashboard.</p>
      </div>

      <form class="login-form" @submit.prevent="onSubmit">
        <label class="field">
          <span>Email</span>
          <input v-model="email" type="email" autocomplete="username" required placeholder="you@example.com" />
        </label>

        <label class="field">
          <span>Password</span>
          <input
v-model="password" type="password" autocomplete="current-password" minlength="8" required
            placeholder="••••••••" />
        </label>

        <button type="submit" class="primary-button" :disabled="loading">
          {{ loading ? "Signing in…" : "Sign in" }}
        </button>

        <p v-if="error" class="error-message">{{ error }}</p>
      </form>

      <p class="login-footnote">
        <router-link to="/">Back to home</router-link>
      </p>
    </section>
  </main>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 2rem;
  background: #f5f7fb;
}

.login-card {
  width: min(480px, 100%);
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 28px 80px rgba(15, 23, 42, 0.08);
}

.login-header h1 {
  margin: 0 0 0.5rem;
  font-size: 2rem;
}

.login-header p {
  margin: 0 0 1.75rem;
  color: #4b5563;
}

.login-form {
  display: grid;
  gap: 1rem;
}

.field {
  display: grid;
  gap: 0.5rem;
  font-weight: 600;
  color: #111827;
}

.field input {
  width: 100%;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 0.75rem;
  padding: 0.9rem 1rem;
  font-size: 1rem;
  background: #f9fafb;
  color: #111827;
}

.field input:focus {
  outline: none;
  border-color: #38bdf8;
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.16);
}

.primary-button {
  width: 100%;
  padding: 0.95rem 1rem;
  border: none;
  border-radius: 0.85rem;
  background: #0f766e;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s ease;
}

.primary-button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.primary-button:hover:not(:disabled) {
  background: #115e59;
}

.error-message {
  margin: 0;
  color: #b91c1c;
  font-size: 0.95rem;
}

.login-footnote {
  margin-top: 1.5rem;
  text-align: center;
  color: #4b5563;
}

.login-footnote a {
  color: #0f766e;
}
</style>
