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
import { WEEKDAY_LABELS, buildMonthDays, formatMoney, isOffDay } from '../../utils/work'

const store = useProfileStore()
const { now, snapshot } = useWorkDay()
const salaryReady = computed(() => store.profile.salaryReady)
const monthLabel = computed(() => `${now.value.getMonth() + 1}月出勤`)

function goMe() {
  uni.switchTab({ url: '/pages/me/index' })
}
const days = computed(() =>
  buildMonthDays(now.value, store.profile.offDates, store.profile.workDates),
)

const editing = ref(false)

function toggleEdit() {
  editing.value = !editing.value
}

function toggleDay(day: number) {
  if (!editing.value) return
  const date = new Date(now.value.getFullYear(), now.value.getMonth(), day)
  store.setDateOff(date, !isOffDay(date, store.profile.offDates, store.profile.workDates))
}

onHide(() => {
  editing.value = false
})
</script>

<template>
  <view class="page">
    <text class="eyebrow">CALENDAR</text>
    <text class="title">{{ monthLabel }}</text>
    <text class="lead">周末、法定节假日默认休息，调休补班默认上班。要改的话先点编辑。</text>

    <view class="card" @click="!salaryReady && goMe()">
      <text class="muted">本月累计</text>
      <text class="big">{{ salaryReady ? `¥${formatMoney(snapshot.monthEarned)}` : '写月薪后就能看' }}</text>
      <text class="muted">本月上班 {{ snapshot.workDays }} 天，已上班 {{ snapshot.workedDays }} 天。{{
        !salaryReady ? '' : snapshot.status === 'off' ? '今天休息，不计入今日已赚' : `含今日已赚 ¥${formatMoney(snapshot.earned)}`
      }}</text>
    </view>

    <view class="card" :class="{ editing }">
      <view class="cal-head">
        <text class="cal-title">{{ editing ? '点日期改休息或上班' : '本月日历' }}</text>
        <view class="edit-btn" @click="toggleEdit">
          <text>{{ editing ? '完成' : '编辑' }}</text>
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
