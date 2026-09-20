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
import { computed, nextTick, ref, watch } from 'vue'
import { useWorkDay } from '../../composables/useWorkDay'
import { useProfileStore } from '../../stores/profile'
import type { WeekendRule } from '../../types'
import {
    WEEKDAY_LABELS,
    WEEKEND_RULES,
    buildMonthDays,
    dateKey,
    formatDateLabel,
    formatDuration,
    formatMoney,
    hhmmToMinutes,
    isBigWeek,
    isOffDay,
    minutesToHHmm,
    overtimeEntryOf,
    overtimeMinutesOf,
    overtimePay,
    overtimeStartTime,
    restOvertimeWindow,
    restScheduleFrom,
    weekendRuleLabel,
} from '../../utils/work'

const store = useProfileStore()
const { now, snapshot, view } = useWorkDay()
const salaryReady = computed(() => store.profile.salaryReady)
const monthLabel = computed(() => `${now.value.getMonth() + 1}月出勤`)
const schedule = computed(() => restScheduleFrom(store.profile))
const ruleLabel = computed(() => weekendRuleLabel(store.profile.weekendRule))
const thisWeekBig = computed(() => isBigWeek(now.value, store.profile.bigWeekAnchor))
const calTitle = computed(() => {
  if (editing.value) return '选制度，或点日期改一天'
  if (store.profile.weekendRule === 'bigSmall') {
    return `本月日历 · 大小周 · ${thisWeekBig.value ? '本周大周' : '本周小周'}`
  }
  return `本月日历 · ${ruleLabel.value}`
})

function goMe() {
  uni.switchTab({ url: '/pages/me/index' })
}
const days = computed(() =>
  buildMonthDays(
    now.value,
    store.profile.offDates,
    store.profile.workDates,
    schedule.value,
    store.profile.overtime,
  ),
)

const editing = ref(false)
const picked = ref<Date | null>(null)
const OT_PRESETS = [
  { minutes: 60, label: '1小时' },
  { minutes: 120, label: '2小时' },
  { minutes: 180, label: '3小时' },
]

const pickedKey = computed(() => (picked.value ? dateKey(picked.value) : ''))
const pickedLabel = computed(() => (picked.value ? formatDateLabel(picked.value) : ''))
const pickedEntry = computed(() =>
  picked.value ? overtimeEntryOf(store.profile.overtime, picked.value) : { minutes: 0 },
)
const pickedMinutes = computed(() => pickedEntry.value.minutes)
const pickedHourly = computed(() => pickedEntry.value.hourly ?? 0)
const pickedDouble = computed(() => Boolean(pickedEntry.value.double))
const pickedShift = computed(() => Boolean(pickedEntry.value.shift))
const hourlyText = ref('')
const rateFixed = ref(false)
const startText = ref('')
const pickedStart = computed(() =>
  overtimeStartTime(pickedEntry.value, pickedOff.value ? store.profile.startTime : store.profile.endTime),
)
const sheetDate = ref<Date | null>(null)
const sheetOn = ref(false)
const pickedIsToday = computed(() => pickedKey.value === dateKey(now.value))
const pickedOff = computed(() =>
  Boolean(
    picked.value &&
    isOffDay(picked.value, store.profile.offDates, store.profile.workDates, schedule.value),
  ),
)
const pickedCell = computed(() => days.value.find((cell) => cell?.key === pickedKey.value) ?? null)
const otOn = computed(() => pickedMinutes.value > 0)
let ignoreClose = false
let closeTimer: ReturnType<typeof setTimeout> | null = null
const restOtTimes = computed(() => ({
  startTime: store.profile.startTime,
  endTime: store.profile.endTime,
  lunchStartTime: store.profile.lunchStartTime,
  lunchEndTime: store.profile.lunchEndTime,
  hasLunch: store.profile.hasLunch,
}))
const restWindow = computed(() =>
  pickedOff.value && otOn.value ? restOvertimeWindow(pickedEntry.value, restOtTimes.value) : null,
)
const restLunchOverlap = computed(() => restWindow.value?.lunchSeconds ?? 0)
const pickedOtPay = computed(() =>
  overtimePay(
    pickedEntry.value,
    view.value.wage.second,
    restLunchOverlap.value,
    restWindow.value?.paidSeconds,
  ),
)
const pickedDayEarned = computed(() =>
  (pickedOff.value ? 0 : view.value.daily) + pickedOtPay.value,
)
const dayKind = computed(() => {
  const today = pickedIsToday.value ? '今天 · ' : ''
  if (pickedOff.value) return `${today}${pickedCell.value?.isHoliday ? '法定假日' : '休息日'}`
  if (pickedCell.value?.isMakeup) return `${today}调休上班`
  return `${today}上班日`
})
const dayHours = computed(() => {
  if (pickedOff.value && !pickedShift.value) return '不算工时'
  const lunch = store.profile.hasLunch
    ? `，午休 ${store.profile.lunchStartTime}–${store.profile.lunchEndTime}`
    : ''
  return `${store.profile.startTime}–${store.profile.endTime}${lunch}`
})
const dayAmount = computed(() => {
  if (pickedOff.value && !otOn.value) return '不计收入'
  if (!salaryReady.value) return '写月薪后就能看'
  const amount = pickedIsToday.value ? view.value.earned : pickedDayEarned.value
  return `¥${formatMoney(amount)}`
})
const dayMoneyLabel = computed(() => {
  if (pickedOff.value && !otOn.value) return '休息不计工时'
  if (!salaryReady.value) return '写下月薪后看这天收入'
  if (pickedOff.value) {
    const extra = pickedDouble.value ? ' · 双倍' : ''
    return pickedIsToday.value ? `休息加班${extra}` : `休息加班收入${extra}`
  }
  if (pickedIsToday.value) return view.value.afterCosts ? '今日已赚 · 已扣固定支出' : '今日已赚'
  return view.value.afterCosts ? '当日收入 · 已扣固定支出' : '当日收入'
})
const otHint = computed(() => {
  if (!pickedMinutes.value) return pickedIsToday.value ? '今天按平时下班' : '这天没有加班'
  const double = pickedDouble.value ? ' · 双倍' : ''
  const lunch = restLunchOverlap.value ? ` · 午休 ${formatDuration(restLunchOverlap.value)}不计` : ''
  const pay = overtimePay(
    pickedEntry.value,
    snapshot.value.wage.second,
    restLunchOverlap.value,
    restWindow.value?.paidSeconds,
  )
  if (pickedShift.value) {
    const hours = `${store.profile.startTime}–${store.profile.endTime}`
    if (pickedHourly.value > 0) {
      return `按上班节奏 ${hours}${lunch} · ¥${formatMoney(pickedHourly.value, 0)}/小时${double} · 约 ¥${formatMoney(pay)}`
    }
    if (!salaryReady.value) return `按上班节奏 ${hours}${lunch} · 平时秒薪${double}`
    return `按上班节奏 ${hours}${lunch} · 平时秒薪${double} · 约 ¥${formatMoney(pay)}`
  }
  const text = formatDuration(pickedMinutes.value * 60)
  const defaultStart = pickedOff.value ? store.profile.startTime : store.profile.endTime
  const from = pickedStart.value !== defaultStart ? `从 ${pickedStart.value} 起 · ` : ''
  if (pickedHourly.value > 0) {
    return `${from}加班 ${text}${lunch} · ¥${formatMoney(pickedHourly.value, 0)}/小时${double} · 约 ¥${formatMoney(pay)}`
  }
  if (!salaryReady.value) return `${from}加班 ${text}${lunch} · 平时秒薪${double}`
  return `${from}加班 ${text}${lunch} · 平时秒薪${double} · 约 ¥${formatMoney(pay)}`
})

watch(picked, (date) => {
  if (!date) {
    hourlyText.value = ''
    rateFixed.value = false
    startText.value = store.profile.endTime
    return
  }
  const entry = overtimeEntryOf(store.profile.overtime, date)
  hourlyText.value = entry.hourly ? String(entry.hourly) : ''
  rateFixed.value = Boolean(entry.hourly)
  startText.value = overtimeStartTime(
    entry,
    isOffDay(date, store.profile.offDates, store.profile.workDates, schedule.value)
      ? store.profile.startTime
      : store.profile.endTime,
  )
})

function toggleEdit() {
  closeOt(true)
  editing.value = !editing.value
}

function pickRule(rule: WeekendRule) {
  store.setWeekendRule(rule, now.value)
}

function pickThisWeek(isBig: boolean) {
  store.setThisWeekBig(isBig, now.value)
}

function onDay(cell: { day: number; isOff: boolean }) {
  const date = new Date(now.value.getFullYear(), now.value.getMonth(), cell.day)
  if (editing.value) {
    store.setDateOff(date, !isOffDay(date, store.profile.offDates, store.profile.workDates, schedule.value))
    return
  }
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
  picked.value = date
  sheetDate.value = date
  sheetOn.value = false
  nextTick(() => {
    setTimeout(() => {
      sheetOn.value = true
    }, 16)
  })
}

function toggleOt() {
  if (!picked.value) return
  if (otOn.value) {
    persistOt(0, 0, startText.value, picked.value, false, false)
    return
  }
  if (pickedOff.value) {
    persistOt(1, 0, store.profile.startTime, picked.value, false, true)
    return
  }
  persistOt(60, 0, startText.value || store.profile.endTime, picked.value, false, false)
}

function toggleDouble() {
  if (!picked.value || !pickedOff.value || !pickedMinutes.value) return
  persistOt(
    pickedMinutes.value,
    rateFixed.value ? Number(hourlyText.value) || 0 : 0,
    startText.value,
    picked.value,
    !pickedDouble.value,
    pickedShift.value,
  )
}

function persistOt(
  minutes: number,
  hourly = pickedHourly.value,
  start = startText.value,
  date = picked.value ?? sheetDate.value,
  double = pickedOff.value ? pickedDouble.value : false,
  shift = pickedOff.value ? pickedShift.value : false,
) {
  if (!date) return
  store.setOvertime(date, minutes, hourly, start, double, shift)
}

function pickShift() {
  if (!picked.value || !pickedOff.value) return
  persistOt(
    1,
    rateFixed.value ? Number(hourlyText.value) || 0 : 0,
    store.profile.startTime,
    picked.value,
    pickedDouble.value,
    true,
  )
}

function pickOt(minutes: number) {
  persistOt(minutes, pickedHourly.value, startText.value, picked.value ?? sheetDate.value, pickedOff.value ? pickedDouble.value : false, false)
}

function onCustomOt(e: { detail: { value: string } }) {
  pickOt(hhmmToMinutes(e.detail.value))
}

function pickRate(fixed: boolean) {
  if (!picked.value || !pickedMinutes.value) return
  rateFixed.value = fixed
  if (!fixed) {
    hourlyText.value = ''
    persistOt(pickedMinutes.value, 0)
    return
  }
  const hourly = Number(hourlyText.value) || 0
  if (hourly > 0) persistOt(pickedMinutes.value, hourly)
}

function onHourly(e: { detail: { value: string } }) {
  hourlyText.value = e.detail.value
  if (!picked.value || !pickedMinutes.value) return
  persistOt(pickedMinutes.value, Number(e.detail.value) || 0)
}

function onOtStart(e: { detail: { value: string } }) {
  const start = e.detail.value
  startText.value = start
  ignoreClose = true
  const date = picked.value ?? sheetDate.value
  const minutes = date ? overtimeMinutesOf(store.profile.overtime, date) : pickedMinutes.value
  if (minutes) persistOt(minutes, rateFixed.value ? Number(hourlyText.value) || 0 : 0, start, date)
  setTimeout(() => {
    ignoreClose = false
  }, 400)
}

function closeOt(instant = false) {
  if (ignoreClose && !instant) return
  if (!picked.value) return
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
  if (instant) {
    sheetOn.value = false
    picked.value = null
    return
  }
  sheetOn.value = false
  closeTimer = setTimeout(() => {
    picked.value = null
    closeTimer = null
  }, 220)
}

onHide(() => {
  editing.value = false
  closeOt(true)
})
</script>

<template>
  <view class="page">
    <view class="eyebrow">
      <text>CALENDAR</text>
    </view>
    <text class="title">{{ monthLabel }}</text>
    <text class="lead">点日期看当天。加班在弹层里开。要改制度或休息，先点编辑。</text>

    <view class="card" @click="!salaryReady && goMe()">
      <text class="muted">{{ view.afterCosts ? '本月累计 · 已扣固定支出' : '本月累计' }}</text>
      <text class="big">{{ salaryReady ? `¥${formatMoney(view.monthEarned)}` : '写月薪后就能看' }}</text>
      <text class="muted">本月上班 {{ snapshot.workDays }} 天，已上班 {{ snapshot.workedDays }} 天</text>
    </view>

    <view class="card" :class="{ editing }">
      <view class="cal-head">
        <text class="cal-title">{{ calTitle }}</text>
        <view class="edit-btn" @click="toggleEdit">
          <text>{{ editing ? '完成' : '编辑' }}</text>
        </view>
      </view>
      <view v-if="editing" class="rules">
        <view
          v-for="item in WEEKEND_RULES"
          :key="item.id"
          class="chip"
          :class="{ on: store.profile.weekendRule === item.id }"
          @click="pickRule(item.id)"
        >
          <text>{{ item.label }}</text>
        </view>
      </view>
      <view v-if="editing && store.profile.weekendRule === 'bigSmall'" class="rules phase">
        <view class="chip" :class="{ on: thisWeekBig }" @click="pickThisWeek(true)">
          <text>本周大周</text>
        </view>
        <view class="chip" :class="{ on: !thisWeekBig }" @click="pickThisWeek(false)">
          <text>本周小周</text>
        </view>
      </view>
      <view class="week">
        <text v-for="label in WEEKDAY_LABELS" :key="label" class="week-label">{{ label }}</text>
      </view>
      <view class="grid">
        <view
          v-for="(cell, index) in days"
          :key="cell?.key ?? `pad-${index}`"
          class="day"
          :class="cell ? { today: cell.isToday, off: cell.isOff, weekend: cell.isWeekend } : 'empty'"
          @click="cell && onDay(cell)"
        >
          <text v-if="cell" class="day-num">{{ cell.day }}</text>
          <text v-if="cell?.isOvertime" class="mark ot">加</text>
          <text v-else-if="cell?.isHoliday" class="mark">休</text>
          <text v-else-if="cell?.isMakeup" class="mark makeup">班</text>
        </view>
      </view>
      <view class="legend">
        <view class="dot today" />
        <text>今天</text>
        <view class="dot off" />
        <text>休息</text>
        <text class="mark">休</text>
        <text>假日</text>
        <text class="mark makeup">班</text>
        <text>调休</text>
        <text class="mark ot">加</text>
        <text>加班</text>
      </view>
    </view>

    <view v-if="picked" class="overlay" :class="{ on: sheetOn }" @click.self="closeOt()" @touchmove.stop.prevent>
      <view class="sheet" @click.stop>
        <text class="sheet-title">{{ pickedLabel }}</text>
        <text class="muted">{{ dayKind }}</text>
        <text v-if="!pickedOff || pickedShift" class="muted">{{ dayHours }}</text>
        <text v-if="!pickedOff || otOn" class="sheet-money" :class="{ locked: !salaryReady }">{{ dayAmount }}</text>
        <text v-if="!pickedOff || otOn" class="muted">{{ dayMoneyLabel }}</text>
        <view class="switch-row">
          <text class="label">加班</text>
          <view class="switch" :class="{ on: otOn }" @click="toggleOt">
            <view class="knob" />
          </view>
        </view>
        <view v-if="otOn" class="ot-block">
          <view v-if="!pickedShift" class="ot-start">
            <text class="muted">加班从</text>
            <picker mode="time" :value="startText || pickedStart" @change="onOtStart">
              <view class="chip">
                <text>{{ startText || pickedStart }}</text>
              </view>
            </picker>
            <text class="muted">开始</text>
          </view>
          <view class="rules">
            <view v-if="pickedOff" class="chip" :class="{ on: pickedShift }" @click="pickShift">
              <text>跟上班一样</text>
            </view>
            <view
              v-for="item in OT_PRESETS"
              :key="item.minutes"
              class="chip"
              :class="{ on: !pickedShift && pickedMinutes === item.minutes }"
              @click="pickOt(item.minutes)"
            >
              <text>{{ item.label }}</text>
            </view>
            <picker mode="time" :value="minutesToHHmm(pickedMinutes)" @change="onCustomOt">
            <view class="chip" :class="{ on: !pickedShift && ![60, 120, 180].includes(pickedMinutes) }">
              <text>{{ !pickedShift && ![60, 120, 180].includes(pickedMinutes) ? minutesToHHmm(pickedMinutes) : '其他' }}</text>
              </view>
            </picker>
          </view>
          <view class="rules">
            <view class="chip" :class="{ on: !rateFixed }" @click="pickRate(false)">
              <text>平时秒薪</text>
            </view>
            <view class="chip" :class="{ on: rateFixed }" @click="pickRate(true)">
              <text>固定时薪</text>
            </view>
          </view>
          <view v-if="rateFixed" class="input-wrap">
            <input
              type="digit"
              placeholder="每小时多少元"
              :value="hourlyText"
              :cursor-spacing="32"
              adjust-position
              @input="onHourly"
            />
          </view>
          <view v-if="pickedOff" class="switch-row nested">
            <text class="label">双倍工资</text>
            <view class="switch" :class="{ on: pickedDouble }" @click="toggleDouble">
              <view class="knob" />
            </view>
          </view>
          <text class="muted">{{ otHint }}</text>
        </view>
        <view v-if="!pickedOff || otOn" class="edit-btn done" @click="closeOt()">
          <text>好了</text>
        </view>
      </view>
    </view>
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

.card {
  margin-top: 24rpx;
  padding: 28rpx;
  border-radius: 32rpx;
  background: #fffdf8;
}

.big {
  display: block;
  margin: 12rpx 0;
  font-size: 52rpx;
  font-weight: 700;
  color: #1c1b18;
}

.cal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.cal-title {
  flex: 1;
  margin-right: 16rpx;
  font-size: 30rpx;
  font-weight: 700;
  color: #1c1b18;
  line-height: 1.4;
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

.rules {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.rules.phase {
  margin-top: -8rpx;
}

.chip {
  height: 56rpx;
  padding: 0 20rpx;
  border-radius: 28rpx;
  background: #f7f3eb;
  display: flex;
  align-items: center;
}

.chip text {
  font-size: 22rpx;
  color: #6d675c;
}

.chip.on {
  background: #2b2a26;
}

.chip.on text {
  color: #f6f1e8;
}

.week,
.grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8rpx;
}

.week {
  margin-bottom: 12rpx;
}

.week-label {
  text-align: center;
  font-size: 22rpx;
  color: #9a9488;
}

.day {
  height: 88rpx;
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.day.empty {
  visibility: hidden;
}

.day-num {
  font-size: 26rpx;
  color: #1c1b18;
}

.day.weekend .day-num {
  color: #9a9488;
}

.day.today {
  box-shadow: inset 0 0 0 2rpx #7c6246;
}

.day.off {
  background: #7c6246;
}

.day.off .day-num,
.day.off .mark {
  color: #f6f1e8;
}

.mark {
  font-size: 18rpx;
  line-height: 1;
  color: #c45c48;
}

.mark.makeup {
  color: #7c6246;
}

.mark.ot {
  color: #7c6246;
}

.day.off .mark.ot {
  color: #f6f1e8;
}

.edit-btn.done {
  width: fit-content;
  margin-top: 28rpx;
  margin-left: auto;
}

.overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: flex-end;
  padding: 32rpx;
  background: rgba(28, 27, 24, 0.4);
  box-sizing: border-box;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.overlay.on {
  opacity: 1;
}

.sheet {
  width: 100%;
  padding: 36rpx 28rpx 28rpx;
  border-radius: 32rpx;
  background: #fffdf8;
  box-sizing: border-box;
  transform: translateY(100%);
  transition: transform 0.2s ease-out;
}

.overlay.on .sheet {
  transform: translateY(0);
}

.sheet-title {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: #1c1b18;
}

.sheet-money {
  display: block;
  margin-top: 16rpx;
  font-size: 52rpx;
  font-weight: 700;
  color: #1c1b18;
}

.sheet-money.locked {
  font-size: 30rpx;
}

.sheet .muted {
  margin-top: 8rpx;
}

.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 28rpx;
}

.switch-row.nested {
  margin-top: 20rpx;
}

.switch-row .label {
  font-size: 28rpx;
  color: #1c1b18;
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

.switch.dim {
  opacity: 0.4;
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

.ot-block {
  margin-top: 8rpx;
}

.sheet .rules {
  margin: 24rpx 0 8rpx;
}

.ot-start {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 20rpx;
}

.ot-start .muted {
  margin-top: 0;
}

.input-wrap {
  display: flex;
  align-items: center;
  height: 72rpx;
  padding: 0 20rpx;
  margin-top: 8rpx;
  border-radius: 16rpx;
  background: #f7f3eb;
  box-sizing: border-box;
}

.input-wrap input {
  width: 100%;
  height: 72rpx;
  min-height: 72rpx;
  line-height: 72rpx;
  padding: 0;
  margin: 0;
  border: none;
  background: transparent;
  color: #1c1b18;
  font-size: 28rpx;
}

.legend {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-top: 20rpx;
  font-size: 22rpx;
  color: #8a8478;
}

.dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
}

.dot.today {
  margin-left: 0;
  box-shadow: inset 0 0 0 2rpx #7c6246;
}

.dot.off {
  margin-left: 16rpx;
  background: #7c6246;
}
</style>
