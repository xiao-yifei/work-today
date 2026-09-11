<script setup lang="ts">
import BottomNav from './components/BottomNav.vue'
</script>

<template>
  <div class="shell">
    <router-view />
    <BottomNav />
  </div>
</template>
