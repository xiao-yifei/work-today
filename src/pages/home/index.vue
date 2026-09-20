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
import MascotArt from '../../components/MascotArt.vue'
import MascotFace from '../../components/MascotFace.vue'
import { openCalc } from '../../composables/useCalcTab'
import { useWorkDay } from '../../composables/useWorkDay'
import { useProfileStore } from '../../stores/profile'
import {
  companionText,
  formatClock,
  formatDateLabel,
  formatDuration,
  formatHHmm,
  formatMoney,
  formatWage,
  heroSubtitle,
  heroTitle,
  statusLabel,
} from '../../utils/work'

const store = useProfileStore()
const { now, snapshot, view } = useWorkDay()

const resting = computed(() => snapshot.value.status === 'off')
const awaiting = computed(() => snapshot.value.status === 'awaiting')
const idle = computed(() =>
  snapshot.value.status === 'off' ||
  snapshot.value.status === 'after' ||
  snapshot.value.status === 'before' ||
  awaiting.value,
)
const dateLabel = computed(() => formatDateLabel(now.value))
const salaryReady = computed(() => store.profile.salaryReady)
const eyebrow = computed(() => (snapshot.value.dayOff ? 'RESTDAY · SPROUT' : 'WORKDAY · SPROUT'))
const startLabel = computed(() =>
  snapshot.value.dayOff && snapshot.value.overtimeMinutes
    ? snapshot.value.overtimeStart
    : store.profile.startTime,
)
const otRateLabel = computed(() => {
  const hourly = snapshot.value.overtimeHourly
  const double = snapshot.value.overtimeDouble
  if (hourly > 0 && double) return `按 ¥${formatMoney(hourly, 0)}/小时 · 双倍算`
  if (hourly > 0) return `按 ¥${formatMoney(hourly, 0)}/小时算`
  if (double) return '按双倍平时秒薪算'
  return '按平时秒薪算'
})

const clockText = computed(() => {
  if (snapshot.value.status === 'off' || snapshot.value.status === 'after') return '00:00:00'
  return formatClock(snapshot.value.remaining)
})
const workedLabel = computed(() =>
  resting.value ? '今日休息' : `已工作 ${formatDuration(snapshot.value.worked)}`,
)
const progressPct = computed(() => Math.round(snapshot.value.progress * 100))
const progressWidth = computed(() => `${snapshot.value.progress * 100}%`)
const endLabel = computed(() =>
  snapshot.value.overtimeMinutes ? formatHHmm(snapshot.value.end) : store.profile.endTime,
)
const showLunchMeta = computed(() => store.profile.hasLunch && snapshot.value.status === 'lunch')
const showOtMeta = computed(() =>
  snapshot.value.overtimeMinutes > 0 &&
  (snapshot.value.status === 'overtime' ||
    snapshot.value.status === 'after' ||
    (snapshot.value.dayOff && snapshot.value.status === 'lunch')),
)
const liveWage = computed(() => {
  if (snapshot.value.status !== 'overtime') return view.value.wage
  const multi = snapshot.value.overtimeDouble ? 2 : 1
  if (snapshot.value.overtimeHourly > 0 || snapshot.value.overtimeDouble) {
    const hourly = (snapshot.value.overtimeHourly || view.value.wage.hourly) * multi
    return {
      hourly,
      minute: hourly / 60,
      second: hourly / 3600,
    }
  }
  return view.value.wage
})
const goods = computed(() =>
  store.profile.goods.slice(0, 2).map((item) => ({
    ...item,
    mark: [...(item.name.trim() || '·')][0],
    count: (Math.max(0, view.value.earned) / Math.max(1, item.price || 1)).toFixed(1),
  })),
)
const editingMemo = ref(false)

function goTab(url: string) {
  uni.switchTab({ url })
}

function toggleMemo() {
  if (editingMemo.value) store.setMemo(store.profile.memo.trim())
  editingMemo.value = !editingMemo.value
}

function onMemo(e: { detail: { value: string } }) {
  store.setMemo(e.detail.value)
}

onHide(() => {
  if (editingMemo.value) store.setMemo(store.profile.memo.trim())
  editingMemo.value = false
})
</script>

<template>
  <view class="page">
    <view class="top">
      <view class="eyebrow">
        <text>{{ eyebrow }}</text>
      </view>
      <view class="title-row">
        <text class="date">{{ dateLabel }}</text>
        <view class="badge" :class="{ rest: resting }" @click="goTab(resting || snapshot.status === 'overtime' || awaiting || (snapshot.dayOff && snapshot.status === 'lunch') ? '/pages/calendar/index' : '/pages/me/index')">
          <view class="dot" />
          <text class="badge-text">{{ statusLabel(snapshot.status, snapshot.dayOff, snapshot.overtimeShift) }}</text>
        </view>
      </view>
    </view>

    <view class="hero">
      <view class="hero-copy">
        <text class="hero-kicker">{{ heroTitle(snapshot.status, snapshot.dayOff, snapshot.overtimeShift) }}</text>
        <text class="hero-clock">{{ clockText }}</text>
        <text class="hero-sub">{{
          snapshot.status === 'overtime' && !(snapshot.dayOff && snapshot.overtimeShift)
            ? `多待的这段，${otRateLabel}`
            : heroSubtitle(snapshot.status, snapshot.dayOff, snapshot.overtimeShift)
        }}</text>
        <view class="earn">
          <text class="earn-label">{{ !idle && view.afterCosts ? '扣除支出后' : '今日已赚' }}</text>
          <text v-if="salaryReady" class="earn-value">¥{{ formatMoney(view.earned) }}</text>
          <text v-else class="earn-value locked" @click="goTab('/pages/me/index')">写月薪后就能看</text>
          <text class="month" @click="goTab(salaryReady ? '/pages/calendar/index' : '/pages/me/index')">
            已上 {{ snapshot.workedDays }} 天{{ salaryReady ? ` · ¥${formatMoney(view.monthEarned)}` : '' }} ›
          </text>
        </view>
      </view>
      <view class="hero-art">
        <MascotArt />
      </view>
    </view>

    <view class="card">
      <view class="card-head">
        <text class="card-title">今日工作进度</text>
        <text class="card-extra">{{ progressPct }}%</text>
      </view>
      <view class="bar">
        <view class="bar-fill" :style="{ width: progressWidth }" />
      </view>
      <view class="bar-meta">
        <text>{{ startLabel }}</text>
        <text>{{ workedLabel }}</text>
        <text>{{ endLabel }}</text>
      </view>
      <text v-if="showLunchMeta" class="lunch-meta">
        午休 {{ store.profile.lunchStartTime }}–{{ store.profile.lunchEndTime }}，不计工时
      </text>
      <text v-if="showOtMeta" class="lunch-meta">
        {{ snapshot.overtimeShift ? '按上班节奏' : `含加班 ${formatDuration(snapshot.overtimeMinutes * 60)}` }}{{
          !snapshot.overtimeShift && snapshot.overtimeStart && snapshot.overtimeStart !== store.profile.endTime
            ? `，从 ${snapshot.overtimeStart} 起`
            : ''
        }}{{
          snapshot.overtimeLunchSeconds ? `，午休 ${formatDuration(snapshot.overtimeLunchSeconds)}不计` : ''
        }}，{{ otRateLabel }}
      </text>
    </view>

    <view v-if="salaryReady" class="card wage">
      <view class="wage-item">
        <text class="wage-num">¥ {{ formatWage(liveWage.hourly) }}</text>
        <text class="wage-label">每小时工资</text>
      </view>
      <view class="wage-item">
        <text class="wage-num">¥ {{ formatWage(liveWage.minute) }}</text>
        <text class="wage-label">每分钟工资</text>
      </view>
      <view class="wage-item last">
        <text class="wage-num">¥ {{ formatWage(liveWage.second, 3) }}</text>
        <text class="wage-label">每秒工资</text>
      </view>
    </view>

    <view class="card">
      <view class="card-head">
        <text class="card-title">今日购买力</text>
        <text v-if="salaryReady" class="card-extra" @click.stop="openCalc('goods')">全部换算 ›</text>
      </view>
      <text v-if="salaryReady" class="hint">把今天的努力，换成生活里的小确幸</text>
      <text v-else class="hint locked-text" @click="goTab('/pages/me/index')">写月薪后就能看</text>
      <view v-if="salaryReady && goods.length" class="goods">
        <view v-for="item in goods" :key="item.id" class="good">
          <view class="good-icon">
            <text>{{ item.mark }}</text>
          </view>
          <view>
            <text class="good-num">{{ item.count }} {{ item.unit }}</text>
            <text class="good-sub">{{ item.name }} · ¥{{ item.price }}/{{ item.unit }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="card">
      <view class="card-head">
        <text class="card-title">今日备忘</text>
        <view class="edit-btn" @click="toggleMemo">
          <text>{{ editingMemo ? '完成' : '编辑' }}</text>
        </view>
      </view>
      <textarea
        v-if="editingMemo"
        class="memo-input"
        :value="store.profile.memo"
        maxlength="80"
        placeholder="今天还没有备忘"
        @input="onMemo"
      />
      <text v-else class="memo">{{ store.profile.memo || '今天还没有备忘' }}</text>
    </view>

    <view class="card companion">
      <view class="companion-copy">
        <text class="card-title">小芽陪你</text>
        <text class="companion-text">{{ companionText(snapshot.status, snapshot.remaining, snapshot.dayOff && snapshot.overtimeShift) }}</text>
      </view>
      <MascotFace />
    </view>
  </view>
</template>

<style scoped>
.page {
  padding: 24rpx 32rpx 48rpx;
}

.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.date {
  font-size: 48rpx;
  font-weight: 700;
  color: #1c1b18;
}

.badge {
  display: flex;
  align-items: center;
  height: 56rpx;
  padding: 0 20rpx;
  border-radius: 28rpx;
  background: #2b2a26;
}

.dot {
  width: 10rpx;
  height: 10rpx;
  margin-right: 10rpx;
  border-radius: 50%;
  background: #d7c16a;
}

.badge-text {
  color: #f6f1e8;
  font-size: 22rpx;
}

.badge.rest {
  background: #7c6246;
}

.hero {
  position: relative;
  min-height: 380rpx;
  margin-top: 24rpx;
  padding: 40rpx 32rpx 32rpx;
  border-radius: 40rpx;
  background: #2b2a26;
  overflow: hidden;
}

.hero-copy {
  position: relative;
  z-index: 1;
  width: 62%;
}

.hero-kicker,
.hero-sub,
.earn-label,
.month {
  display: block;
  color: rgba(246, 241, 232, 0.62);
  font-size: 22rpx;
}

.hero-clock {
  display: block;
  margin: 8rpx 0 10rpx;
  color: #f6f1e8;
  font-size: 64rpx;
  font-weight: 700;
  line-height: 1.1;
}

.earn {
  margin-top: 40rpx;
}

.earn-value {
  display: block;
  margin: 8rpx 0;
  color: #f6f1e8;
  font-size: 52rpx;
  font-weight: 700;
}

.earn-value.locked {
  font-size: 34rpx;
  font-weight: 600;
}

.month {
  color: rgba(246, 241, 232, 0.78);
}

.hero-art {
  position: absolute;
  right: 0;
  bottom: 12rpx;
}

.card {
  margin-top: 20rpx;
  padding: 28rpx;
  border-radius: 32rpx;
  background: #fffdf8;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #1c1b18;
}

.card-extra {
  font-size: 24rpx;
  color: #7c6246;
}

.bar {
  height: 16rpx;
  margin: 24rpx 0 16rpx;
  border-radius: 16rpx;
  background: #efe8db;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 16rpx;
  background: #7c6246;
}

.bar-meta {
  display: flex;
  justify-content: space-between;
  color: #8a8478;
  font-size: 22rpx;
}

.lunch-meta {
  display: block;
  margin-top: 12rpx;
  font-size: 22rpx;
  color: #9a9488;
}

.locked-text {
  color: #7c6246;
  font-size: 26rpx;
}

.wage {
  display: flex;
  padding: 32rpx 8rpx;
}

.wage-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-right: 1px solid #efe8db;
}

.wage-item.last {
  border-right: none;
}

.wage-num {
  font-size: 28rpx;
  font-weight: 700;
  color: #1c1b18;
}

.wage-label {
  margin-top: 8rpx;
  font-size: 20rpx;
  color: #8a8478;
}

.hint {
  display: block;
  margin: 12rpx 0 20rpx;
  font-size: 22rpx;
  color: #9a9488;
}

.goods {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
}

.good {
  min-width: 0;
  display: flex;
  align-items: center;
  padding: 20rpx;
  border-radius: 24rpx;
  background: #f6f1e8;
}

.good > view:last-child {
  min-width: 0;
}

.good-icon {
  width: 64rpx;
  height: 64rpx;
  margin-right: 12rpx;
  border-radius: 20rpx;
  background: #fffdf8;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #7c6246;
  font-size: 24rpx;
}

.good-num,
.good-sub {
  display: block;
}

.good-num {
  font-size: 30rpx;
  font-weight: 700;
  color: #1c1b18;
}

.good-sub {
  margin-top: 4rpx;
  font-size: 20rpx;
  color: #8a8478;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
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

.memo {
  display: block;
  margin-top: 16rpx;
  font-size: 28rpx;
  color: #3d3b35;
  line-height: 1.6;
}

.memo-input {
  width: 100%;
  height: 160rpx;
  margin-top: 16rpx;
  padding: 20rpx 24rpx;
  border-radius: 20rpx;
  background: #f7f3eb;
  color: #1c1b18;
  font-size: 28rpx;
  line-height: 1.5;
  box-sizing: border-box;
}

.companion {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.companion-copy {
  flex: 1;
  margin-right: 16rpx;
}

.companion-text {
  display: block;
  margin-top: 10rpx;
  font-size: 26rpx;
  color: #6d675c;
  line-height: 1.6;
}
</style>
