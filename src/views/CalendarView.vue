<script setup lang="ts">
import { computed, ref } from 'vue'
import { useWorkDay } from '../composables/useWorkDay'
import { useProfileStore } from '../stores/profile'
import { WEEKDAY_LABELS, buildMonthDays, formatMoney, isOffDay } from '../utils/work'

const store = useProfileStore()
const { now, snapshot } = useWorkDay()

const monthLabel = computed(() => `${now.value.getMonth() + 1}月出勤`)
const days = computed(() =>
  buildMonthDays(now.value, store.profile.offDates, store.profile.workDates),
)

const editing = ref(false)

function toggleDay(day: number) {
  if (!editing.value) return
  const date = new Date(now.value.getFullYear(), now.value.getMonth(), day)
  store.setDateOff(date, !isOffDay(date, store.profile.offDates, store.profile.workDates))
}
</script>

<template>
  <main class="page">
    <header>
      <p class="eyebrow">CALENDAR</p>
      <h1>{{ monthLabel }}</h1>
      <p class="lead">周末、法定节假日默认休息，调休补班默认上班。要改的话先点编辑。</p>
    </header>

    <section class="card">
      <p>本月累计</p>
      <strong>¥{{ formatMoney(snapshot.monthEarned) }}</strong>
      <small>本月上班 {{ snapshot.workDays }} 天，已上班 {{ snapshot.workedDays }} 天。{{
        snapshot.status === 'off' ? '今天休息，不计入今日已赚' : `含今日已赚 ¥${formatMoney(snapshot.earned)}`
      }}</small>
    </section>

    <section class="card calendar" :class="{ editing }">
      <div class="cal-head">
        <p>{{ editing ? '点日期改休息或上班' : '本月日历' }}</p>
        <button type="button" class="edit-btn" @click="editing = !editing">
          {{ editing ? '完成' : '编辑' }}
        </button>
      </div>
      <div class="week">
        <span v-for="label in WEEKDAY_LABELS" :key="label">{{ label }}</span>
      </div>
      <div class="grid">
        <button
          v-for="(cell, index) in days"
          :key="cell?.key ?? `pad-${index}`"
          type="button"
          class="day"
          :class="cell && { today: cell.isToday, off: cell.isOff, weekend: cell.isWeekend, holiday: cell.isHoliday, makeup: cell.isMakeup }"
          :disabled="!cell"
          @click="cell && toggleDay(cell.day)"
        >
          <span>{{ cell?.day ?? '' }}</span>
          <small v-if="cell?.isHoliday">休</small>
          <small v-else-if="cell?.isMakeup">班</small>
        </button>
      </div>
      <p class="legend">
        <span class="dot today" /> 今天
        <span class="dot off" /> 休息
        <span class="tag">休</span> 假日
        <span class="tag makeup">班</span> 调休
      </p>
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
.card p,
.card small,
.legend {
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

.cal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.cal-head p {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #1c1b18;
}

.edit-btn {
  height: 30px;
  padding: 0 12px;
  border: none;
  border-radius: 999px;
  background: #2b2a26;
  color: #f6f1e8;
  font-size: 12px;
}

.week,
.grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}

.week {
  margin-bottom: 8px;
}

.week span {
  text-align: center;
  font-size: 12px;
  color: #9a9488;
}

.day {
  height: 48px;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: #1c1b18;
  font-size: 14px;
  font-variant-numeric: tabular-nums;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
}

.day small,
.tag {
  font-size: 10px;
  line-height: 1;
  color: #c45c48;
}

.tag.makeup,
.day.makeup small {
  color: #7c6246;
}

.day.off small {
  color: #f0d8c8;
}

.day:disabled {
  visibility: hidden;
}

.day.weekend {
  color: #9a9488;
}

.day.today {
  box-shadow: inset 0 0 0 1.5px #7c6246;
}

.day.off {
  background: #7c6246;
  color: #f6f1e8;
}

.calendar:not(.editing) .day {
  pointer-events: none;
}

.legend {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 12px 0 0;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-left: 10px;
}

.dot:first-child {
  margin-left: 0;
}

.dot.today {
  box-shadow: inset 0 0 0 1.5px #7c6246;
}

.dot.off {
  background: #7c6246;
}
</style>
