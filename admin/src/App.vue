<script setup lang="ts">


</script>

<template>
  <UApp>
    <div class="app-shell">
      <RouterView />
    </div>
  </UApp>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
