<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Search, ShoppingCart, UserRound } from '@lucide/vue'

const scrolled = ref(false)

function onScroll() {
  scrolled.value = window.scrollY > 24
}

onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
})
const loggedIn = false
</script>

<template>
  <header :class="[
    'fixed inset-x-0 top-0 z-40 transition-all duration-200',
    scrolled ? 'backdrop-blur-sm' : '',
  ]" :style="{
    background: scrolled ? 'var(--color-surface)' : 'transparent',
    borderBottom: scrolled ? '1px solid var(--color-border)' : 'none',
    boxShadow: scrolled ? 'var(--shadow-sm)' : 'none',
  }">
    <div class="container flex items-center justify-between h-21">
      <!-- Left: Logo -->
      <div class="flex items-center gap-4">
        <div class="text-2xl" style="font-family: var(--font-heading); color: var(--color-heading)">
          LnQ
          <small class="block text-sm" style="font-family: var(--font-body); color: var(--color-muted)">Cake &
            Cookies</small>
        </div>
      </div>

      <!-- Center: Nav -->
      <nav class="hidden md:flex gap-8 text-sm font-medium" style="color: var(--color-text)">
        <a href="#">Home</a>
        <a href="#">Shop</a>
        <a href="#">Birthday Cakes</a>
        <a href="#">Contact</a>
      </nav>

      <!-- Right: Actions -->
      <div class="flex items-center gap-3">
        <button class="p-2 rounded-md" aria-label="search" :title="'Search'">
          <Search :size="18" stroke-width="1.5" style="color: var(--color-heading)" />
        </button>
        <button class="p-2 rounded-md" aria-label="cart" :title="'Cart'">
          <ShoppingCart :size="18" stroke-width="1.5" style="color: var(--color-heading)" />
        </button>
        <a class="btn btn-secondary hidden md:inline-flex" v-if="!loggedIn" href="">Login</a>
        <button class="md:hidden p-2" aria-label="menu" v-else>
          <UserRound :size="18" stroke-width="1.5" style="color: var(--color-heading)" />
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
header {
  transition:
    background 220ms ease,
    border-color 220ms ease,
    box-shadow 220ms ease;
}
</style>
