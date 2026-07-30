<script setup lang="ts">
import { onMounted } from 'vue';
import GoogleLogo from '@/assets/images/google.svg';
import FacebookLogo from '@/assets/images/facebook.svg';

onMounted(() => {
  document.title = 'LnQ | Login';
});
</script>

<template>
  <section class="min-h-[calc(100vh-84px)] bg-(--color-background) py-20">
    <div class="container grid gap-12 lg:grid-cols-[1.1fr_0.9fr] items-center">
      <div class="space-y-6">
        <h1
          class="max-w-2xl"
          style="color: var(--color-heading)"
        >
          Welcome Back
        </h1>
        <p class="max-w-xl text-base text-(--color-text)">
          Return to your curated favorites and keep your most desired desserts ready for
          your next celebration.
        </p>
      </div>

      <div class="card p-8 lg:p-10">
        <div class="space-y-6">
          <div>
            <h2>Account login</h2>
            <p class="mt-2 text-sm text-(--color-muted)">
              A quiet, polished entry to your personalized bakery experience.
            </p>
          </div>

          <div class="grid gap-3">
            <button
              type="button"
              class="btn btn-secondary w-full justify-center"
            >
              <img
                :src="GoogleLogo"
                alt="Google"
                class="h-4 w-4 mr-2"
              />
              <span>Continue with Google</span>
            </button>
            <button
              type="button"
              class="btn btn-secondary w-full justify-center"
            >
              <img
                :src="FacebookLogo"
                alt="Facebook"
                class="h-4 w-4 mr-2"
              />
              <span>Continue with Facebook</span>
            </button>
          </div>

          <div class="relative">
            <div
              class="absolute inset-x-0 top-1/2 border-t border-(--color-divider)"
            ></div>
            <div
              class="relative mx-auto w-fit bg-(--color-surface) px-4 text-xs text-(--color-muted)"
            >
              or sign in with email
            </div>
          </div>

          <form class="space-y-5">
            <div class="space-y-2">
              <label
                class="block text-sm font-medium text-(--color-heading)"
                for="email"
                >Email address</label
              >
              <input
                id="email"
                type="email"
                placeholder="hello@lnqcakes.com"
              />
            </div>

            <div class="space-y-2">
              <label
                class="block text-sm font-medium text-(--color-heading)"
                for="password"
                >Password</label
              >
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
              />
            </div>

            <div
              class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <label
                class="inline-flex items-center gap-3 whitespace-nowrap text-sm text-(--color-text)"
              >
                <input
                  type="checkbox"
                  class="h-4 w-4 rounded border border-(--color-border)] text-(--color-primary) focus:ring-(--color-secondary)"
                />
                <span>Remind me</span>
              </label>
              <a
                href="#"
                class="text-sm font-medium"
                style="color: var(--color-primary)"
                >Forgot password?</a
              >
            </div>

            <button
              type="submit"
              class="btn btn-primary w-full"
            >
              Continue
            </button>
          </form>

          <div class="mt-4 text-center text-sm text-(--color-text)">
            Don’t have an account?
            <a
              href="/register"
              class="font-medium"
              style="color: var(--color-primary)"
              >Create one</a
            >
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.card {
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}
input {
  width: 100%;
}
</style>
