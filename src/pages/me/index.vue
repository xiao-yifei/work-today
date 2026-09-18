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
import { countWorkDaysInMonth, dailyFixedShare, dailySalary, formatMoney, monthlyFixedTotal, restScheduleFrom, scheduleError, wagesFromDaily, workSecondsFromTimes } from '../../utils/work'

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
  belongings: profile.value.belongings.map((item) => ({ ...item })),
  fixedCosts: profile.value.fixedCosts.map((item) => ({ ...item })),
  offDates: [...profile.value.offDates],
  workDates: [...profile.value.workDates],
    weekendRule: profile.value.weekendRule,
    bigWeekAnchor: profile.value.bigWeekAnchor,
    salaryReady: profile.value.salaryReady,
    showAfterCosts: profile.value.showAfterCosts,
  })

const workDays = computed(() =>
  countWorkDaysInMonth(new Date(), store.profile.offDates, store.profile.workDates, restScheduleFrom(store.profile)),
)

const preview = computed(() => {
  const total = workSecondsFromTimes(form.startTime, form.endTime, form.lunchStartTime, form.lunchEndTime, form.hasLunch)
  const daily = dailySalary(Number(salaryText.value) || 0, workDays.value)
  const monthlyFixed = monthlyFixedTotal(store.profile.fixedCosts)
  const usedDaily =
    store.profile.showAfterCosts && monthlyFixed > 0
      ? daily - dailyFixedShare(monthlyFixed, workDays.value)
      : daily
  return {
    daily: usedDaily,
    ...wagesFromDaily(usedDaily, total),
  }
})

const hasFixedCosts = computed(() => monthlyFixedTotal(store.profile.fixedCosts) > 0)
const previewAfterCosts = computed(() => store.profile.showAfterCosts && hasFixedCosts.value)

const salaryText = ref(profile.value.salaryReady ? String(profile.value.monthlySalary) : '')

const invalid = computed(() => {
  const typed = salaryText.value.trim()
  if (!typed && !profile.value.salaryReady) return ''
  if (!(Number(salaryText.value) > 0)) return '请填写有效月薪'
  return scheduleError(form)
})

const previewReady = computed(() => Number(salaryText.value) > 0 && !scheduleError(form))
const dirty = ref(false)

function persist() {
  if (invalid.value) return
  const salary = Number(salaryText.value)
  const hasSalary = salary > 0
  dirty.value = false
  store.save({
    monthlySalary: hasSalary ? salary : store.profile.monthlySalary,
    workDaysPerMonth: workDays.value,
    startTime: form.startTime,
    endTime: form.endTime,
    lunchStartTime: form.lunchStartTime,
    lunchEndTime: form.lunchEndTime,
    hasLunch: form.hasLunch,
    memo: store.profile.memo,
    goods: store.profile.goods.map((item) => ({ ...item })),
    belongings: store.profile.belongings.map((item) => ({ ...item })),
    fixedCosts: store.profile.fixedCosts.map((item) => ({ ...item })),
    offDates: [...store.profile.offDates],
    workDates: [...store.profile.workDates],
    weekendRule: store.profile.weekendRule,
    bigWeekAnchor: store.profile.bigWeekAnchor,
    salaryReady: hasSalary ? true : store.profile.salaryReady,
    showAfterCosts: store.profile.showAfterCosts,
  })
}

onHide(() => {
  if (dirty.value) persist()
})

function onSalary(e: { detail: { value: string } }) {
  salaryText.value = e.detail.value
  dirty.value = true
}

function onStart(e: { detail: { value: string } }) {
  form.startTime = e.detail.value
  dirty.value = true
  persist()
}

function onEnd(e: { detail: { value: string } }) {
  form.endTime = e.detail.value
  dirty.value = true
  persist()
}

function onLunchStart(e: { detail: { value: string } }) {
  form.lunchStartTime = e.detail.value
  dirty.value = true
  persist()
}

function onLunchEnd(e: { detail: { value: string } }) {
  form.lunchEndTime = e.detail.value
  dirty.value = true
  persist()
}

function setHasLunch(on: boolean) {
  form.hasLunch = on
  dirty.value = true
  persist()
}

function setShowAfterCosts(on: boolean) {
  store.setShowAfterCosts(on)
}
</script>

<template>
  <view class="page">
    <view class="eyebrow">
      <text>PROFILE</text>
    </view>
    <text class="title">工作设置</text>
    <text class="lead">改完会存到本地。休息日和上班天数在日历里改。</text>

    <view class="card">
      <text class="muted">{{ previewReady ? (previewAfterCosts ? '扣掉固定支出后，时薪约为' : '按当前月薪和日历上班天数，时薪约为') : '写下月薪后就能看时薪' }}</text>
      <text class="big">{{ previewReady ? `¥${formatMoney(preview.hourly)}` : '写月薪后就能看' }}</text>
      <text class="muted">本月上班 {{ workDays }} 天{{ previewReady ? `，日薪约 ¥${formatMoney(preview.daily)}` : '' }}。</text>
    </view>

    <view class="card form">
      <view class="field">
        <text class="label">月薪（元）</text>
        <view class="input-wrap">
          <input
            type="digit"
            :value="salaryText"
            placeholder="写下月薪"
            :cursor-spacing="32"
            adjust-position
            @input="onSalary"
            @blur="persist"
          />
        </view>
      </view>
      <view class="split">
        <view class="field half">
          <text class="label">上班时间</text>
          <picker mode="time" :value="form.startTime" @change="onStart">
            <view class="picker">{{ form.startTime }}</view>
          </picker>
        </view>
        <view class="field half">
          <text class="label">下班时间</text>
          <picker mode="time" :value="form.endTime" @change="onEnd">
            <view class="picker">{{ form.endTime }}</view>
          </picker>
        </view>
      </view>
      <view class="switch-row">
        <text class="label">午休</text>
        <view class="switch" :class="{ on: form.hasLunch }" @click="setHasLunch(!form.hasLunch)">
          <view class="knob" />
        </view>
      </view>
      <view v-if="form.hasLunch" class="split">
        <view class="field half">
          <text class="label">午休开始</text>
          <picker mode="time" :value="form.lunchStartTime" @change="onLunchStart">
            <view class="picker">{{ form.lunchStartTime }}</view>
          </picker>
        </view>
        <view class="field half">
          <text class="label">午休结束</text>
          <picker mode="time" :value="form.lunchEndTime" @change="onLunchEnd">
            <view class="picker">{{ form.lunchEndTime }}</view>
          </picker>
        </view>
      </view>
      <view class="switch-row last">
        <text class="label">扣除支出</text>
        <view class="switch" :class="{ on: store.profile.showAfterCosts }" @click="setShowAfterCosts(!store.profile.showAfterCosts)">
          <view class="knob" />
        </view>
      </view>
      <text v-if="invalid" class="error">{{ invalid }}</text>
    </view>

    <text class="privacy">小荧提示：你的信息只收在本地哦。</text>
  </view>
</template>

<style scoped>
.page {
  padding: 24rpx 32rpx 48rpx;
}

.title {
  display: block;
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

.privacy {
  display: block;
  margin-top: 32rpx;
  font-size: 22rpx;
  color: #9a9488;
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

.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.switch-row.last {
  margin-bottom: 0;
}

.switch-row .label {
  margin-bottom: 0;
}

.switch {
  position: relative;
  flex-shrink: 0;
  width: 96rpx;
  height: 52rpx;
  border-radius: 26rpx;
  background: #efe8db;
  overflow: hidden;
  font-size: 0;
  line-height: 0;
  transition: background-color 0.25s ease;
}

.switch.on {
  background: #2b2a26;
}

.knob {
  position: absolute;
  top: 2rpx;
  left: 2rpx;
  width: 48rpx;
  height: 48rpx;
  border-radius: 24rpx;
  background: #fffdf8;
  transition: left 0.25s ease;
}

.switch.on .knob {
  left: 46rpx;
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
