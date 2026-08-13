<script setup lang="ts"></script>

<template>
  <main class="view-page">
    <section class="hero-card">
      <p class="eyebrow">Dashboard</p>
      <h1>Welcome back</h1>
      <p>
        Your admin console is now rendering normally. Use the navigation above to move between the home and login views.
      </p>
    </section>
  </main>
</template>

<style scoped>
.view-page {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.5rem;
}

.hero-card {
  width: min(720px, 100%);
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 1.25rem;
  padding: 2rem;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
}

.eyebrow {
  margin: 0 0 0.5rem;
  color: #0f766e;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.8rem;
}

h1 {
  margin: 0 0 0.75rem;
  font-size: 2rem;
}

p {
  margin: 0;
  color: #475569;
  line-height: 1.7;
}
</style>
