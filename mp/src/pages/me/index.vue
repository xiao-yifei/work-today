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
import { storeToRefs } from 'pinia'
import { computed, reactive, watch } from 'vue'
import { useProfileStore } from '../../stores/profile'
import type { Profile } from '../../types'
import { dailySalary, formatMoney, scheduleError, wagesFromDaily, workSecondsFromTimes } from '../../utils/work'

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

function onSalary(e: { detail: { value: string } }) {
  form.monthlySalary = Number(e.detail.value) || 0
}

function onDays(e: { detail: { value: string } }) {
  form.workDaysPerMonth = Number(e.detail.value) || 0
}

function onCoffee(e: { detail: { value: string } }) {
  form.goods[0].price = Number(e.detail.value) || 1
}

function onLunch(e: { detail: { value: string } }) {
  form.goods[1].price = Number(e.detail.value) || 1
}

function onStart(e: { detail: { value: string } }) {
  form.startTime = e.detail.value
}

function onEnd(e: { detail: { value: string } }) {
  form.endTime = e.detail.value
}

function onLunchStart(e: { detail: { value: string } }) {
  form.lunchStartTime = e.detail.value
}

function onLunchEnd(e: { detail: { value: string } }) {
  form.lunchEndTime = e.detail.value
}

function onMemo(e: { detail: { value: string } }) {
  form.memo = e.detail.value
}
</script>

<template>
  <view class="page">
    <text class="eyebrow">PROFILE</text>
    <text class="title">工作设置</text>
    <text class="lead">改完会立刻存到本地，回首页就能看到新的倒计时和收入。</text>

    <view class="card">
      <text class="muted">按当前设置，时薪约为</text>
      <text class="big">¥{{ formatMoney(preview.hourly) }}</text>
    </view>

    <view class="card form">
      <view class="field">
        <text class="label">月薪（元）</text>
        <view class="input-wrap">
          <input
            type="digit"
            :value="String(form.monthlySalary)"
            :cursor-spacing="32"
            adjust-position
            @input="onSalary"
          />
        </view>
      </view>
      <view class="field">
        <text class="label">每月工作日</text>
        <view class="input-wrap">
          <input
            type="digit"
            :value="String(form.workDaysPerMonth)"
            :cursor-spacing="32"
            adjust-position
            @input="onDays"
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
      <view class="split">
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
      <view class="field">
        <text class="label">今日备忘</text>
        <textarea :value="form.memo" maxlength="80" @input="onMemo" />
      </view>
      <view class="split">
        <view class="field half">
          <text class="label">咖啡单价</text>
          <view class="input-wrap">
            <input
              type="digit"
              :value="String(form.goods[0].price)"
              :cursor-spacing="32"
              adjust-position
              @input="onCoffee"
            />
          </view>
        </view>
        <view class="field half">
          <text class="label">午餐单价</text>
          <view class="input-wrap">
            <input
              type="digit"
              :value="String(form.goods[1].price)"
              :cursor-spacing="32"
              adjust-position
              @input="onLunch"
            />
          </view>
        </view>
      </view>
      <text v-if="invalid" class="error">{{ invalid }}</text>
      <view class="actions">
        <button class="primary" :disabled="Boolean(invalid)" @click="persist">保存设置</button>
        <button class="ghost" @click="restore">恢复默认</button>
      </view>
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

textarea {
  width: 100%;
  height: 160rpx;
  padding: 20rpx 24rpx;
  border-radius: 20rpx;
  background: #f7f3eb;
  color: #1c1b18;
  font-size: 28rpx;
  line-height: 1.5;
  box-sizing: border-box;
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

.actions {
  display: flex;
}

button {
  margin: 0;
  border: none;
  border-radius: 20rpx;
  font-size: 28rpx;
  line-height: 88rpx;
}

button::after {
  border: none;
}

.primary {
  flex: 1;
  background: #2b2a26;
  color: #f6f1e8;
}

.ghost {
  width: 200rpx;
  margin-left: 12rpx;
  background: #efe8db;
  color: #2b2a26;
}
</style>
