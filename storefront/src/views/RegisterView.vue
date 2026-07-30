<script setup lang="ts">
import { onMounted, ref } from 'vue';
import GoogleLogo from '@/assets/images/google.svg';
import FacebookLogo from '@/assets/images/facebook.svg';

onMounted(() => {
  document.title = 'LnQ | Register';
});

const name = ref('');
const email = ref('');
const password = ref('');
const confirm_password = ref('');
</script>

<template>
  <section class="min-h-[calc(100vh-84px)] bg-(--color-background) py-20">
    <div class="container grid gap-12 lg:grid-cols-[1.05fr_0.95fr] items-center">
      <div class="space-y-6">
        <h1
          class="max-w-2xl"
          style="color: var(--color-heading)"
        >
          Hello
        </h1>
        <p class="max-w-xl text-base text-(--color-text)">
          Enjoy elegant ordering, saved preferences, and access to limited releases from
          our artisan bakery.
        </p>
      </div>

      <div class="card p-8 lg:p-10">
        <div class="space-y-6">
          <div>
            <h2>Create your account</h2>
            <p class="mt-2 text-sm text-(--color-muted)">
              A refined registration experience with discreet luxury details.
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
              or create with email
            </div>
          </div>

          <form class="space-y-5">
            <div class="space-y-2">
              <label
                class="block text-sm font-medium text-(--color-heading)"
                for="name"
                >Full name</label
              >
              <input
                id="name"
                type="text"
                placeholder="E.g. Isabelle Laurent"
                v-model="name"
              />
            </div>

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
                v-model="email"
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
                placeholder="Create a secure password"
                v-model="password"
              />
            </div>

            <div class="space-y-2">
              <label
                class="block text-sm font-medium text-(--color-heading)"
                for="confirmPassword"
                >Confirm password</label
              >
              <input
                id="confirmPassword"
                type="password"
                placeholder="Repeat your password"
                v-model="confirm_password"
              />
            </div>

            <div
              class="inline-flex items-center gap-3 whitespace-nowrap text-sm text-(--color-text)"
            >
              <input
                type="checkbox"
                class="h-4 w-4 rounded border border-(--color-border) text-(--color-primary) focus:ring-(--color-secondary)"
                id="newsletter"
              />
              <label for="newsletter"
                >Send me reminders and exclusive bakery updates.</label
              >
            </div>

            <button
              type="submit"
              class="btn btn-primary w-full"
            >
              Create Account
            </button>
          </form>

          <div class="mt-4 text-center text-sm text-(--color-text)">
            Already have an account?
            <a
              href="/login"
              class="font-medium"
              style="color: var(--color-primary)"
              >Sign in</a
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
