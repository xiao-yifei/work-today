<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, reactive, ref } from 'vue'
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
  const total = workSecondsFromTimes(form.startTime, form.endTime, form.lunchStartTime, form.lunchEndTime)
  const daily = dailySalary(Number(form.monthlySalary) || 0, workDays.value)
  return wagesFromDaily(daily, total)
})

const invalid = computed(() => {
  if (!(Number(form.monthlySalary) > 0)) return '请填写有效月薪'
  return scheduleError(form)
})

const editing = ref(false)

function syncFormFromStore() {
  const next = store.profile
  form.monthlySalary = next.monthlySalary
  form.workDaysPerMonth = next.workDaysPerMonth
  form.startTime = next.startTime
  form.endTime = next.endTime
  form.lunchStartTime = next.lunchStartTime
  form.lunchEndTime = next.lunchEndTime
  form.memo = next.memo
  form.goods = next.goods.map((item) => ({ ...item }))
  form.fixedCosts = next.fixedCosts.map((item) => ({ ...item }))
  form.offDates = [...next.offDates]
  form.workDates = [...next.workDates]
  form.weekendRule = next.weekendRule
  form.bigWeekAnchor = next.bigWeekAnchor
}

function persist() {
  if (invalid.value) return
  store.save({
    monthlySalary: Number(form.monthlySalary),
    workDaysPerMonth: workDays.value,
    startTime: form.startTime,
    endTime: form.endTime,
    lunchStartTime: form.lunchStartTime,
    lunchEndTime: form.lunchEndTime,
    memo: form.memo.trim(),
    goods: store.profile.goods.map((item) => ({ ...item })),
    fixedCosts: store.profile.fixedCosts.map((item) => ({ ...item })),
    offDates: [...store.profile.offDates],
    workDates: [...store.profile.workDates],
    weekendRule: store.profile.weekendRule,
    bigWeekAnchor: store.profile.bigWeekAnchor,
  })
}

function finishEdit() {
  if (invalid.value) return false
  persist()
  editing.value = false
  return true
}

function toggleEdit() {
  if (editing.value) {
    finishEdit()
    return
  }
  syncFormFromStore()
  editing.value = true
}

</script>

<template>
  <main class="page">
    <header>
      <p class="eyebrow">PROFILE</p>
      <h1>工作设置</h1>
      <p class="lead">要改的话先点编辑，点完成才会存到本地。休息日和上班天数在日历里改。</p>
    </header>

    <section class="card preview">
      <p>按当前月薪和日历上班天数，时薪约为</p>
      <strong>¥{{ formatMoney(preview.hourly) }}</strong>
      <p>本月上班 {{ workDays }} 天，在日历里改</p>
    </section>

    <form class="card" :class="{ editing }" @submit.prevent="toggleEdit">
      <div class="form-head">
        <p>{{ editing ? '点完成存到本地' : '工作参数' }}</p>
        <button type="button" class="edit-btn" @click="toggleEdit">
          {{ editing ? '完成' : '编辑' }}
        </button>
      </div>
      <label>
        <span>月薪（元）</span>
        <input v-model.number="form.monthlySalary" type="number" min="1" step="1" inputmode="decimal" :disabled="!editing" />
      </label>
      <div class="split">
        <label>
          <span>上班时间</span>
          <input v-model="form.startTime" type="time" :disabled="!editing" />
        </label>
        <label>
          <span>下班时间</span>
          <input v-model="form.endTime" type="time" :disabled="!editing" />
        </label>
      </div>
      <div class="split">
        <label>
          <span>午休开始</span>
          <input v-model="form.lunchStartTime" type="time" :disabled="!editing" />
        </label>
        <label>
          <span>午休结束</span>
          <input v-model="form.lunchEndTime" type="time" :disabled="!editing" />
        </label>
      </div>
      <label>
        <span>今日备忘</span>
        <textarea v-model="form.memo" rows="3" maxlength="80" placeholder="今天想记住的一件事" :disabled="!editing" />
      </label>
      <p v-if="editing && invalid" class="error">{{ invalid }}</p>
    </form>
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

form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.form-head p {
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
  font-weight: 600;
}

input:disabled,
textarea:disabled {
  opacity: 0.85;
  color: #3d3b35;
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
