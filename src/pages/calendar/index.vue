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
import { computed, ref } from 'vue'
import { useWorkDay } from '../../composables/useWorkDay'
import { useProfileStore } from '../../stores/profile'
import type { WeekendRule } from '../../types'
import {
    WEEKDAY_LABELS,
    WEEKEND_RULES,
    buildMonthDays,
    formatMoney,
    isBigWeek,
    isOffDay,
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
  buildMonthDays(now.value, store.profile.offDates, store.profile.workDates, schedule.value),
)

const editing = ref(false)

function toggleEdit() {
  editing.value = !editing.value
}

function pickRule(rule: WeekendRule) {
  store.setWeekendRule(rule, now.value)
}

function pickThisWeek(isBig: boolean) {
  store.setThisWeekBig(isBig, now.value)
}

function toggleDay(day: number) {
  if (!editing.value) return
  const date = new Date(now.value.getFullYear(), now.value.getMonth(), day)
  store.setDateOff(date, !isOffDay(date, store.profile.offDates, store.profile.workDates, schedule.value))
}

onHide(() => {
  editing.value = false
})
</script>

<template>
  <view class="page">
    <view class="eyebrow">
      <text>CALENDAR</text>
    </view>
    <text class="title">{{ monthLabel }}</text>
    <text class="lead">假日、调休按国务院。要改制度或某一天，先点编辑。</text>

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
          @click="cell && toggleDay(cell.day)"
        >
          <text v-if="cell" class="day-num">{{ cell.day }}</text>
          <text v-if="cell?.isHoliday" class="mark">休</text>
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
