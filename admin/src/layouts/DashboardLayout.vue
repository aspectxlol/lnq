<script setup lang="ts">
import AppSidebar from '@/components/AppSidebar.vue';



</script>

<template>
  <UApp>
    <div class="app-shell">
      <AppSidebar />
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
