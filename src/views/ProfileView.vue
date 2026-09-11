<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, reactive, watch } from 'vue'
import { useProfileStore } from '../stores/profile'
import type { Profile } from '../types'
import { dailySalary, formatMoney, scheduleError, wagesFromDaily, workSecondsFromTimes } from '../utils/work'

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
})

const preview = computed(() => {
  const total = workSecondsFromTimes(form.startTime, form.endTime, form.lunchStartTime, form.lunchEndTime)
  const daily = dailySalary(Number(form.monthlySalary) || 0, Number(form.workDaysPerMonth) || 1)
  return wagesFromDaily(daily, total)
})

const invalid = computed(() => {
  if (!(Number(form.monthlySalary) > 0)) return '请填写有效月薪'
  if (!(Number(form.workDaysPerMonth) >= 1 && Number(form.workDaysPerMonth) <= 31)) return '工作日需在 1–31 之间'
  return scheduleError(form)
})

function persist() {
  if (invalid.value) return
  store.save({
    monthlySalary: Number(form.monthlySalary),
    workDaysPerMonth: Number(form.workDaysPerMonth),
    startTime: form.startTime,
    endTime: form.endTime,
    lunchStartTime: form.lunchStartTime,
    lunchEndTime: form.lunchEndTime,
    memo: form.memo.trim(),
    goods: form.goods.map((item) => ({
      ...item,
      price: Number(item.price) || 1,
    })),
  })
}

watch(form, persist, { deep: true })

function restore() {
  store.reset()
  const next = store.profile
  form.monthlySalary = next.monthlySalary
  form.workDaysPerMonth = next.workDaysPerMonth
  form.startTime = next.startTime
  form.endTime = next.endTime
  form.lunchStartTime = next.lunchStartTime
  form.lunchEndTime = next.lunchEndTime
  form.memo = next.memo
  form.goods = next.goods.map((item) => ({ ...item }))
}
</script>

<template>
  <main class="page">
    <header>
      <p class="eyebrow">PROFILE</p>
      <h1>工作设置</h1>
      <p class="lead">改完会立刻存到本地，回首页就能看到新的倒计时和收入。</p>
    </header>

    <section class="card preview">
      <p>按当前设置，时薪约为</p>
      <strong>¥{{ formatMoney(preview.hourly) }}</strong>
    </section>

    <form class="card" @submit.prevent="persist">
      <label>
        <span>月薪（元）</span>
        <input v-model.number="form.monthlySalary" type="number" min="1" step="1" inputmode="decimal" />
      </label>
      <label>
        <span>每月工作日</span>
        <input v-model.number="form.workDaysPerMonth" type="number" min="1" max="31" step="1" />
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
      <div class="split">
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
      <div class="split">
        <label>
          <span>咖啡单价</span>
          <input v-model.number="form.goods[0].price" type="number" min="1" step="1" />
        </label>
        <label>
          <span>午餐单价</span>
          <input v-model.number="form.goods[1].price" type="number" min="1" step="1" />
        </label>
      </div>
      <p v-if="invalid" class="error">{{ invalid }}</p>
      <div class="actions">
        <button type="submit" class="primary" :disabled="Boolean(invalid)">保存设置</button>
        <button type="button" class="ghost" @click="restore">恢复默认</button>
      </div>
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

.actions {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
}

button {
  border: 0;
  border-radius: 12px;
  height: 44px;
  padding: 0 16px;
  font: inherit;
  font-weight: 600;
}

.primary {
  background: #2b2a26;
  color: #f6f1e8;
}

.primary:disabled {
  opacity: 0.45;
}

.ghost {
  background: #efe8db;
  color: #2b2a26;
}
</style>
