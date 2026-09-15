<script lang="ts">
import { onShareAppMessage, onShareTimeline, showShareMenu } from '../../utils/share'

export default {
  onShareAppMessage,
  onShareTimeline,
  onShow() {
    showShareMenu()
  },
}
</script>

<script setup lang="ts">
import { onHide } from '@dcloudio/uni-app'
import { storeToRefs } from 'pinia'
import { computed, reactive, ref } from 'vue'
import { useProfileStore } from '../../stores/profile'
import type { Profile } from '../../types'
import { countWorkDaysInMonth, dailySalary, formatMoney, scheduleError, wagesFromDaily, workSecondsFromTimes } from '../../utils/work'

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
  offDates: [...profile.value.offDates],
  workDates: [...profile.value.workDates],
  salaryReady: profile.value.salaryReady,
})

const workDays = computed(() =>
  countWorkDaysInMonth(new Date(), store.profile.offDates, store.profile.workDates),
)

const preview = computed(() => {
  const total = workSecondsFromTimes(form.startTime, form.endTime, form.lunchStartTime, form.lunchEndTime)
  const daily = dailySalary(Number(salaryText.value) || 0, workDays.value)
  return wagesFromDaily(daily, total)
})

const salaryText = ref(String(profile.value.monthlySalary))

const invalid = computed(() => {
  if (!(Number(salaryText.value) > 0)) return '请填写有效月薪'
  return scheduleError(form)
})

const editing = ref(!profile.value.salaryReady)

function syncFormFromStore() {
  const next = store.profile
  form.monthlySalary = next.monthlySalary
  form.workDaysPerMonth = next.workDaysPerMonth
  form.startTime = next.startTime
  form.endTime = next.endTime
  form.lunchStartTime = next.lunchStartTime
  form.lunchEndTime = next.lunchEndTime
  form.goods = next.goods.map((item) => ({ ...item }))
  form.offDates = [...next.offDates]
  form.workDates = [...next.workDates]
  form.salaryReady = next.salaryReady
  salaryText.value = String(next.monthlySalary)
}

function persist() {
  if (invalid.value) return
  store.save({
    monthlySalary: Number(salaryText.value),
    workDaysPerMonth: workDays.value,
    startTime: form.startTime,
    endTime: form.endTime,
    lunchStartTime: form.lunchStartTime,
    lunchEndTime: form.lunchEndTime,
    memo: store.profile.memo,
    goods: store.profile.goods.map((item) => ({ ...item })),
    offDates: [...store.profile.offDates],
    workDates: [...store.profile.workDates],
    salaryReady: true,
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

onHide(() => {
  if (!editing.value) return
  syncFormFromStore()
  editing.value = false
})

function onSalary(e: { detail: { value: string } }) {
  if (!editing.value) return
  salaryText.value = e.detail.value
}

function onStart(e: { detail: { value: string } }) {
  if (!editing.value) return
  form.startTime = e.detail.value
}

function onEnd(e: { detail: { value: string } }) {
  if (!editing.value) return
  form.endTime = e.detail.value
}

function onLunchStart(e: { detail: { value: string } }) {
  if (!editing.value) return
  form.lunchStartTime = e.detail.value
}

function onLunchEnd(e: { detail: { value: string } }) {
  if (!editing.value) return
  form.lunchEndTime = e.detail.value
}
</script>

<template>
  <view class="page">
    <text class="eyebrow">PROFILE</text>
    <text class="title">工作设置</text>
    <text class="lead">要改的话先点编辑，点完成才会存到本地。每月上班天数在日历里点。</text>

    <view class="card">
      <text class="muted">{{ store.profile.salaryReady || editing ? '按当前月薪和日历上班天数，时薪约为' : '写下月薪后就能看时薪' }}</text>
      <text class="big">{{ store.profile.salaryReady || editing ? `¥${formatMoney(preview.hourly)}` : '写月薪后就能看' }}</text>
      <text class="muted">本月上班 {{ workDays }} 天，在日历里改</text>
    </view>

    <view class="card form" :class="{ editing }">
      <view class="form-head">
        <text class="form-title">{{ editing ? '点完成存到本地' : '工作参数' }}</text>
        <view class="edit-btn" @click="toggleEdit">
          <text>{{ editing ? '完成' : '编辑' }}</text>
        </view>
      </view>
      <view class="field">
        <text class="label">月薪（元）</text>
        <view class="input-wrap">
          <input
            type="digit"
            :value="salaryText"
            :disabled="!editing"
            :cursor-spacing="32"
            adjust-position
            @input="onSalary"
          />
        </view>
      </view>
      <view class="split">
        <view class="field half">
          <text class="label">上班时间</text>
          <picker v-if="editing" mode="time" :value="form.startTime" @change="onStart">
            <view class="picker">{{ form.startTime }}</view>
          </picker>
          <view v-else class="picker">{{ form.startTime }}</view>
        </view>
        <view class="field half">
          <text class="label">下班时间</text>
          <picker v-if="editing" mode="time" :value="form.endTime" @change="onEnd">
            <view class="picker">{{ form.endTime }}</view>
          </picker>
          <view v-else class="picker">{{ form.endTime }}</view>
        </view>
      </view>
      <view class="split">
        <view class="field half">
          <text class="label">午休开始</text>
          <picker v-if="editing" mode="time" :value="form.lunchStartTime" @change="onLunchStart">
            <view class="picker">{{ form.lunchStartTime }}</view>
          </picker>
          <view v-else class="picker">{{ form.lunchStartTime }}</view>
        </view>
        <view class="field half">
          <text class="label">午休结束</text>
          <picker v-if="editing" mode="time" :value="form.lunchEndTime" @change="onLunchEnd">
            <view class="picker">{{ form.lunchEndTime }}</view>
          </picker>
          <view v-else class="picker">{{ form.lunchEndTime }}</view>
        </view>
      </view>
      <text v-if="editing && invalid" class="error">{{ invalid }}</text>
    </view>
  </view>
</template>

<style scoped>
.page {
  padding: 24rpx 32rpx 48rpx;
}

.eyebrow {
  display: block;
  font-size: 22rpx;
  letter-spacing: 2rpx;
  color: #8a8478;
}

.title {
  display: block;
  margin-top: 8rpx;
  font-size: 48rpx;
  font-weight: 700;
  color: #1c1b18;
}

.lead,
.muted {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #8a8478;
  line-height: 1.6;
}

.card {
  margin-top: 24rpx;
  padding: 28rpx;
  border-radius: 32rpx;
  background: #fffdf8;
}

.big {
  display: block;
  margin-top: 8rpx;
  font-size: 48rpx;
  font-weight: 700;
  color: #1c1b18;
}

.form-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.form-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #1c1b18;
}

.edit-btn {
  height: 56rpx;
  padding: 0 24rpx;
  border-radius: 28rpx;
  background: #2b2a26;
}

.edit-btn text {
  color: #f6f1e8;
  font-size: 22rpx;
}

.field {
  margin-bottom: 24rpx;
}

.label {
  display: block;
  margin-bottom: 12rpx;
  font-size: 24rpx;
  color: #6d675c;
}

.input-wrap,
.picker {
  height: 88rpx;
  padding: 0 24rpx;
  border-radius: 20rpx;
  background: #f7f3eb;
  box-sizing: border-box;
}

.input-wrap {
  display: flex;
  align-items: center;
}

.input-wrap input {
  width: 100%;
  height: 88rpx;
  min-height: 88rpx;
  line-height: 88rpx;
  padding: 0;
  margin: 0;
  border: none;
  background: transparent;
  color: #1c1b18;
  font-size: 28rpx;
}

.picker {
  display: flex;
  align-items: center;
  color: #1c1b18;
  font-size: 28rpx;
}

.split {
  display: flex;
}

.half {
  flex: 1;
  margin-right: 16rpx;
}

.half:last-child {
  margin-right: 0;
}

.error {
  display: block;
  margin-bottom: 16rpx;
  color: #9a4a32;
  font-size: 24rpx;
}
</style>
