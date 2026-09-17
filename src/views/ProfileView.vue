<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, reactive, watch } from 'vue'
import { useProfileStore } from '../stores/profile'
import type { Profile } from '../types'
import { countWorkDaysInMonth, dailySalary, formatMoney, restScheduleFrom, scheduleError, wagesFromDaily, workSecondsFromTimes } from '../utils/work'

const store = useProfileStore()
const { profile } = storeToRefs(store)

const form = reactive<Profile>({
  monthlySalary: profile.value.monthlySalary,
  workDaysPerMonth: profile.value.workDaysPerMonth,
  startTime: profile.value.startTime,
  endTime: profile.value.endTime,
  lunchStartTime: profile.value.lunchStartTime,
  lunchEndTime: profile.value.lunchEndTime,
  hasLunch: profile.value.hasLunch,
  memo: profile.value.memo,
  goods: profile.value.goods.map((item) => ({ ...item })),
  fixedCosts: profile.value.fixedCosts.map((item) => ({ ...item })),
  offDates: [...profile.value.offDates],
  workDates: [...profile.value.workDates],
  weekendRule: profile.value.weekendRule,
  bigWeekAnchor: profile.value.bigWeekAnchor,
})

const workDays = computed(() =>
  countWorkDaysInMonth(new Date(), store.profile.offDates, store.profile.workDates, restScheduleFrom(store.profile)),
)

const preview = computed(() => {
  const total = workSecondsFromTimes(form.startTime, form.endTime, form.lunchStartTime, form.lunchEndTime, form.hasLunch)
  const daily = dailySalary(Number(form.monthlySalary) || 0, workDays.value)
  return wagesFromDaily(daily, total)
})

const invalid = computed(() => {
  if (!(Number(form.monthlySalary) > 0)) return '请填写有效月薪'
  return scheduleError(form)
})

function persist() {
  if (invalid.value) return
  store.save({
    monthlySalary: Number(form.monthlySalary),
    workDaysPerMonth: workDays.value,
    startTime: form.startTime,
    endTime: form.endTime,
    lunchStartTime: form.lunchStartTime,
    lunchEndTime: form.lunchEndTime,
    hasLunch: form.hasLunch,
    memo: form.memo.trim(),
    goods: store.profile.goods.map((item) => ({ ...item })),
    fixedCosts: store.profile.fixedCosts.map((item) => ({ ...item })),
    offDates: [...store.profile.offDates],
    workDates: [...store.profile.workDates],
    weekendRule: store.profile.weekendRule,
    bigWeekAnchor: store.profile.bigWeekAnchor,
  })
}

watch(
  () => [
    form.monthlySalary,
    form.startTime,
    form.endTime,
    form.lunchStartTime,
    form.lunchEndTime,
    form.hasLunch,
    form.memo,
  ],
  persist,
)

</script>

<template>
  <main class="page">
    <header>
      <p class="eyebrow">PROFILE</p>
      <h1>工作设置</h1>
      <p class="lead">改完会存到本地。休息日和上班天数在日历里改。</p>
    </header>

    <section class="card preview">
      <p>按当前月薪和日历上班天数，时薪约为</p>
      <strong>¥{{ formatMoney(preview.hourly) }}</strong>
      <p>本月上班 {{ workDays }} 天，在日历里改</p>
    </section>

    <section class="card form">
      <p class="form-title">工作参数</p>
      <label>
        <span>月薪（元）</span>
        <input v-model.number="form.monthlySalary" type="number" min="1" step="1" inputmode="decimal" />
      </label>
      <div class="split">
        <label>
          <span>上班时间</span>
          <input v-model="form.startTime" type="time" />
        </label>
        <label>
          <span>下班时间</span>
          <input v-model="form.endTime" type="time" />
        </label>
      </div>
      <div class="switch-row">
        <span>午休</span>
        <button type="button" class="switch" :class="{ on: form.hasLunch }" @click="form.hasLunch = !form.hasLunch">
          <i class="knob" />
        </button>
      </div>
      <div v-if="form.hasLunch" class="split">
        <label>
          <span>午休开始</span>
          <input v-model="form.lunchStartTime" type="time" />
        </label>
        <label>
          <span>午休结束</span>
          <input v-model="form.lunchEndTime" type="time" />
        </label>
      </div>
      <label>
        <span>今日备忘</span>
        <textarea v-model="form.memo" rows="3" maxlength="80" placeholder="今天想记住的一件事" />
      </label>
      <p v-if="invalid" class="error">{{ invalid }}</p>
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
  border: 1px solid rgba(43, 42, 38, 0.04);
}

.preview {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preview p {
  margin: 0;
  color: #8a8478;
  font-size: 13px;
}

.preview strong {
  font-size: 24px;
  color: #1c1b18;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #1c1b18;
}

label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
  color: #6d675c;
}

input,
textarea {
  width: 100%;
  border: 1px solid #ebe4d6;
  background: #f7f3eb;
  border-radius: 12px;
  padding: 12px 12px;
  font: inherit;
  color: #1c1b18;
  box-sizing: border-box;
}

textarea {
  resize: none;
}

.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: #6d675c;
}

.switch {
  position: relative;
  flex-shrink: 0;
  width: 48px;
  height: 26px;
  padding: 0;
  border: none;
  border-radius: 13px;
  background: #efe8db;
  overflow: hidden;
  transition: background-color 0.25s ease;
}

.switch.on {
  background: #2b2a26;
}

.knob {
  position: absolute;
  top: 1px;
  left: 1px;
  width: 24px;
  height: 24px;
  border-radius: 12px;
  background: #fffdf8;
  transition: left 0.25s ease;
}

.switch.on .knob {
  left: 23px;
}

.split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.error {
  margin: 0;
  color: #9a4a32;
  font-size: 13px;
}
</style>
