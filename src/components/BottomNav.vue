<script setup lang="ts">
import { useRoute } from 'vue-router';

const route = useRoute()

const items = [
  { to: '/', name: 'home', label: '今日' },
  { to: '/calc', name: 'calc', label: '换算' },
  { to: '/calendar', name: 'calendar', label: '日历' },
  { to: '/me', name: 'me', label: '我的' },
] as const
</script>

<template>
  <nav class="nav" aria-label="底部导航">
    <router-link
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="item"
      :class="{ active: route.name === item.name }"
    >
      <span class="icon-wrap">
        <svg v-if="item.name === 'home'" viewBox="0 0 24 24" fill="none">
          <path d="M4 11.2 12 4l8 7.2V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8.8Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
        </svg>
        <svg v-else-if="item.name === 'calc'" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="4" width="7" height="7" rx="1.6" stroke="currentColor" stroke-width="1.8" />
          <rect x="13" y="4" width="7" height="7" rx="1.6" stroke="currentColor" stroke-width="1.8" />
          <rect x="4" y="13" width="7" height="7" rx="1.6" stroke="currentColor" stroke-width="1.8" />
          <rect x="13" y="13" width="7" height="7" rx="1.6" stroke="currentColor" stroke-width="1.8" />
        </svg>
        <svg v-else-if="item.name === 'calendar'" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" stroke-width="1.8" />
          <path d="M4 10h16M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8.5" r="3.2" stroke="currentColor" stroke-width="1.8" />
          <path d="M5.5 19c1.4-3 4-4.5 6.5-4.5S17.1 16 18.5 19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        </svg>
      </span>
      <span class="sr-only">{{ item.label }}</span>
    </router-link>
  </nav>
</template>

<style scoped>
.nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  width: min(100%, 430px);
  margin: 0 auto;
  height: calc(64px + env(safe-area-inset-bottom));
  padding: 8px 10px calc(10px + env(safe-area-inset-bottom));
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  align-items: center;
  background: #f7f3eb;
  border-top: 1px solid rgba(40, 36, 28, 0.06);
  box-sizing: border-box;
  z-index: 20;
}

.item {
  color: #2b2a26;
  text-decoration: none;
  height: 40px;
  display: grid;
  place-items: center;
}

.icon-wrap {
  width: 42px;
  height: 36px;
  border-radius: 12px;
  display: grid;
  place-items: center;
}

.icon-wrap svg {
  width: 22px;
  height: 22px;
}

.item.active .icon-wrap {
  background: #2b2a26;
  color: #f7f3eb;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
</style>
