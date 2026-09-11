<script setup lang="ts">
import { computed } from 'vue'
import MascotArt from '../components/MascotArt.vue'
import MascotFace from '../components/MascotFace.vue'
import { useWorkDay } from '../composables/useWorkDay'
import { useProfileStore } from '../stores/profile'
import {
    companionText,
    formatClock,
    formatDateLabel,
    formatDuration,
    formatMoney,
    formatWage,
    heroSubtitle,
    heroTitle,
    statusLabel,
} from '../utils/work'

const store = useProfileStore()
const { now, snapshot } = useWorkDay()

const dateLabel = computed(() => formatDateLabel(now.value))
const clockText = computed(() => {
  if (snapshot.value.status === 'after') return '00:00:00'
  return formatClock(snapshot.value.remaining)
})
const progressPct = computed(() => Math.round(snapshot.value.progress * 100))
const coffeeCount = computed(() => snapshot.value.earned / store.coffee.price)
const lunchCount = computed(() => snapshot.value.earned / store.lunch.price)
</script>

<template>
  <main class="page">
    <header class="top">
      <div>
        <p class="eyebrow">WORK TODAY <span>今天也很棒 ✨</span></p>
        <div class="title-row">
          <h1>{{ dateLabel }}</h1>
          <router-link class="badge" to="/me">
            <i />
            {{ statusLabel(snapshot.status) }}
          </router-link>
        </div>
      </div>
    </header>

    <section class="hero">
      <div class="hero-copy">
        <p class="hero-kicker">{{ heroTitle(snapshot.status) }}</p>
        <p class="hero-clock">{{ clockText }}</p>
        <p class="hero-sub">{{ heroSubtitle(snapshot.status) }}</p>
        <div class="earn">
          <div>
            <p class="earn-label">今日已赚</p>
            <p class="earn-value">¥{{ formatMoney(snapshot.earned) }}</p>
          </div>
          <router-link class="month" to="/calendar">本月累计 ¥{{ formatMoney(snapshot.monthEarned) }} ›</router-link>
        </div>
      </div>
      <div class="hero-art">
        <MascotArt />
      </div>
    </section>

    <section class="card">
      <div class="card-head">
        <h2>今日工作进度</h2>
        <p>{{ progressPct }}% <span>今日进度</span></p>
      </div>
      <div class="bar" role="progressbar" :aria-valuenow="progressPct" aria-valuemin="0" aria-valuemax="100">
        <i :style="{ width: `${snapshot.progress * 100}%` }" />
      </div>
      <div class="bar-meta">
        <span>{{ store.profile.startTime }}</span>
        <span>已工作 {{ formatDuration(snapshot.worked) }}</span>
        <span>{{ store.profile.endTime }}</span>
      </div>
      <p class="lunch-meta">午休 {{ store.profile.lunchStartTime }}–{{ store.profile.lunchEndTime }}，不计工时</p>
    </section>

    <section class="card wage">
      <div>
        <strong>¥ {{ formatWage(snapshot.wage.hourly) }}</strong>
        <span>每小时工资</span>
      </div>
      <div>
        <strong>¥ {{ formatWage(snapshot.wage.minute) }}</strong>
        <span>每分钟工资</span>
      </div>
      <div>
        <strong>¥ {{ formatWage(snapshot.wage.second, 3) }}</strong>
        <span>每秒工资</span>
      </div>
    </section>

    <section class="card">
      <div class="card-head">
        <h2>今日购买力</h2>
        <router-link to="/calc">全部换算 ›</router-link>
      </div>
      <p class="hint">把今天的努力，换成生活里的小确幸</p>
      <div class="goods">
        <article>
          <span class="goods-icon" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none">
              <path d="M8 13h12v8a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5v-8Z" stroke="#7c6246" stroke-width="1.8"/>
              <path d="M20 15h3a3 3 0 0 1 0 6h-3" stroke="#7c6246" stroke-width="1.8"/>
              <path d="M12 6c1 2 1 3 0 5M16 5c1 2 1 4 0 6" stroke="#7c6246" stroke-width="1.6" stroke-linecap="round"/>
            </svg>
          </span>
          <div>
            <strong>{{ coffeeCount.toFixed(1) }} {{ store.coffee.unit }}</strong>
            <small>¥{{ store.coffee.price }}/{{ store.coffee.unit }}</small>
          </div>
        </article>
        <article>
          <span class="goods-icon" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none">
              <path d="M7 15c0-5 4-8 9-8s9 3 9 8H7Z" stroke="#7c6246" stroke-width="1.8"/>
              <path d="M6 17h20c0 6-4 9-10 9s-10-3-10-9Z" stroke="#7c6246" stroke-width="1.8"/>
              <path d="M11 17c.5 2 2 3 5 3s4.5-1 5-3" stroke="#7c6246" stroke-width="1.6" stroke-linecap="round"/>
            </svg>
          </span>
          <div>
            <strong>{{ lunchCount.toFixed(1) }} {{ store.lunch.unit }}</strong>
            <small>¥{{ store.lunch.price }}/{{ store.lunch.unit }}</small>
          </div>
        </article>
      </div>
    </section>

    <router-link class="card memo" to="/me">
      <p>· {{ store.profile.memo || '今天还没有备忘' }}</p>
    </router-link>

    <section class="card companion">
      <div>
        <h2>小荧陪你 ♡</h2>
        <p>{{ companionText(snapshot.status, snapshot.remaining) }}</p>
      </div>
      <MascotFace />
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

.eyebrow span {
  letter-spacing: 0;
  margin-left: 6px;
}

.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

h1 {
  margin: 0;
  font-size: clamp(22px, 7vw, 28px);
  line-height: 1.15;
  letter-spacing: -0.03em;
  color: #1c1b18;
}

.badge {
  flex-shrink: 0;
  height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  background: #2b2a26;
  color: #f6f1e8;
  font-size: 12px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.badge i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #d7c16a;
}

.hero {
  position: relative;
  min-height: 196px;
  padding: 22px 18px 18px;
  border-radius: 24px;
  background: #2b2a26;
  color: #f6f1e8;
  overflow: hidden;
}

.hero-copy {
  position: relative;
  z-index: 1;
  max-width: 62%;
}

.hero-kicker,
.hero-sub,
.earn-label,
.month {
  margin: 0;
  color: rgba(246, 241, 232, 0.62);
  font-size: 12px;
}

.hero-clock {
  margin: 4px 0 6px;
  font-size: 34px;
  line-height: 1;
  font-weight: 700;
  letter-spacing: 0.02em;
  font-variant-numeric: tabular-nums;
}

.earn {
  margin-top: 22px;
}

.earn-value {
  margin: 4px 0 6px;
  font-size: 28px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.month {
  color: rgba(246, 241, 232, 0.78);
  text-decoration: none;
}

.hero-art {
  position: absolute;
  right: -6px;
  bottom: 8px;
}

.card {
  background: #fffdf8;
  border-radius: 20px;
  padding: 16px 16px 14px;
  border: 1px solid rgba(43, 42, 38, 0.04);
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.card-head h2,
.companion h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #1c1b18;
}

.card-head p,
.card-head a {
  margin: 0;
  font-size: 13px;
  color: #7c6246;
  text-decoration: none;
  font-weight: 600;
}

.card-head span {
  color: #9a9488;
  font-weight: 400;
}

.bar {
  margin: 14px 0 10px;
  height: 10px;
  border-radius: 999px;
  background: #efe8db;
  overflow: hidden;
}

.bar i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #7c6246;
}

.bar-meta {
  display: flex;
  justify-content: space-between;
  color: #8a8478;
  font-size: 12px;
}

.lunch-meta {
  margin: 8px 0 0;
  font-size: 12px;
  color: #9a9488;
}

.wage {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  padding: 18px 8px;
}

.wage div {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  border-right: 1px solid #efe8db;
}

.wage div:last-child {
  border-right: none;
}

.wage strong {
  font-size: 16px;
  color: #1c1b18;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.wage span {
  font-size: 11px;
  color: #8a8478;
}

.hint {
  margin: 8px 0 12px;
  font-size: 12px;
  color: #9a9488;
}

.goods {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.goods article {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: 16px;
  background: #f6f1e8;
}

.goods strong {
  display: block;
  font-size: 18px;
  color: #1c1b18;
}

.goods small {
  color: #8a8478;
}

.goods-icon {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: #fffdf8;
  flex-shrink: 0;
}

.goods-icon svg {
  width: 22px;
  height: 22px;
}

.memo {
  text-decoration: none;
}

.memo p,
.companion p {
  margin: 0;
  font-size: 14px;
  color: #3d3b35;
  line-height: 1.6;
}

.companion {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.companion p {
  margin-top: 6px;
  color: #6d675c;
}
</style>
