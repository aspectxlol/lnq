<script lang="ts"></script>

<template>
  <footer
    style="
      background: var(--color-surface);
      border-top: 1px solid var(--color-border);
    "
  >
    <div class="container py-12">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h4>LnQ Cake & Cookies</h4>
          <p class="mt-3 text-sm text-muted">
            Artisan cakes and cookies, handcrafted in small batches.
          </p>
        </div>

        <div>
          <h4>Quick Links</h4>
          <ul class="mt-3 space-y-2 text-sm">
            <li><a href="#">Shop</a></li>
            <li><a href="#">Custom Cakes</a></li>
            <li><a href="#">Contact</a></li>
          </ul>
        </div>
      </div>

      <div class="mt-8 text-sm text-muted">
        ©{{ new Date().getFullYear() }} LnQ Cake & Cookies - All rights
        reserved.
      </div>
    </div>
  </footer>
</template>

<style>
.text-muted {
  color: var(--color-muted);
}
.image {
  border-radius: var(--radius-lg);
}
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}
section {
  padding-block: 4.5rem;
}
h2 {
  font-size: 1.8rem;
}
@media (min-width: 768px) {
  section {
    padding-block: 6rem;
  }
}
</style>
