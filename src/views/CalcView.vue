<script setup lang="ts">
import { computed } from 'vue'
import { useProfileStore } from '../stores/profile'
import { useWorkDay } from '../composables/useWorkDay'
import { formatMoney } from '../utils/work'

const store = useProfileStore()
const { snapshot } = useWorkDay()

const items = computed(() =>
  store.profile.goods.map((item) => ({
    ...item,
    count: snapshot.value.earned / item.price,
  })),
)
</script>

<template>
  <main class="page">
    <header>
      <p class="eyebrow">CALCULATOR</p>
      <h1>全部换算</h1>
      <p class="lead">一期先按今日已赚换算。加班、自定义商品会放到二期。</p>
    </header>

    <section class="card highlight">
      <p>今日已赚</p>
      <strong>¥{{ formatMoney(snapshot.earned) }}</strong>
    </section>

    <section class="card">
      <article v-for="item in items" :key="item.id">
        <div>
          <h2>{{ item.name }}</h2>
          <p>¥{{ item.price }}/{{ item.unit }}</p>
        </div>
        <strong>{{ item.count.toFixed(1) }} {{ item.unit }}</strong>
      </article>
    </section>
  </main>
</template>

<style scoped>
.page {
  padding: 22px 18px 108px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.eyebrow {
  margin: 0 0 6px;
  font-size: 12px;
  letter-spacing: 0.08em;
  color: #8a8478;
}

h1 {
  margin: 0;
  font-size: 28px;
  color: #1c1b18;
}

.lead {
  margin: 8px 0 0;
  color: #8a8478;
  font-size: 13px;
  line-height: 1.6;
}

.card {
  background: #fffdf8;
  border-radius: 20px;
  padding: 16px;
}

.highlight {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.highlight p,
article p {
  margin: 0;
  color: #8a8478;
  font-size: 13px;
}

.highlight strong,
article strong {
  font-size: 24px;
  color: #1c1b18;
}

article {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid #efe8db;
}

article:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

article:first-child {
  padding-top: 0;
}

h2 {
  margin: 0 0 4px;
  font-size: 16px;
}
</style>
