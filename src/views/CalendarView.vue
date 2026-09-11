<script setup lang="ts">
import { computed } from 'vue'
import { useWorkDay } from '../composables/useWorkDay'
import { formatMoney } from '../utils/work'

const { now, snapshot } = useWorkDay()

const monthLabel = computed(() => `${now.value.getMonth() + 1}月出勤`)
</script>

<template>
  <main class="page">
    <header>
      <p class="eyebrow">CALENDAR</p>
      <h1>{{ monthLabel }}</h1>
      <p class="lead">日历明细是二期能力。现在先按工作日估算本月累计。</p>
    </header>

    <section class="card">
      <p>本月累计</p>
      <strong>¥{{ formatMoney(snapshot.monthEarned) }}</strong>
      <small>含今日已赚 ¥{{ formatMoney(snapshot.earned) }}</small>
    </section>

    <section class="card soon">
      <h2>即将上线</h2>
      <p>按天回看收入、补记加班、标记休息日。</p>
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

.lead,
.soon p,
.card p,
.card small {
  color: #8a8478;
  font-size: 13px;
  line-height: 1.6;
}

.lead {
  margin: 8px 0 0;
}

.card {
  background: #fffdf8;
  border-radius: 20px;
  padding: 16px;
}

.card p {
  margin: 0;
}

.card strong {
  display: block;
  margin: 8px 0 6px;
  font-size: 28px;
  color: #1c1b18;
}

.soon h2 {
  margin: 0 0 6px;
  font-size: 16px;
  color: #1c1b18;
}

.soon p {
  margin: 0;
}
</style>
