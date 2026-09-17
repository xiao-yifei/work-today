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
    formatMoney,
    heroSubtitle,
    heroTitle,
    statusLabel,
    summarizeFixedCosts,
} from '../../utils/work'

const store = useProfileStore()
const { now, snapshot } = useWorkDay()

const resting = computed(() => snapshot.value.status === 'off')
const ended = computed(() => snapshot.value.status === 'after' || snapshot.value.status === 'off')
const dateLabel = computed(() => formatDateLabel(now.value))
const salaryReady = computed(() => store.profile.salaryReady)

const clockText = computed(() => formatClock(snapshot.value.remaining))
const workedLabel = computed(() =>
  resting.value ? '今日休息' : `已工作 ${formatDuration(snapshot.value.worked)}`,
)
const progressPct = computed(() => Math.round(snapshot.value.progress * 100))
const progressWidth = computed(() => `${snapshot.value.progress * 100}%`)
const coffeeCount = computed(() => (snapshot.value.earned / store.coffee.price).toFixed(1))
const lunchCount = computed(() => (snapshot.value.earned / store.lunch.price).toFixed(1))
const costSummary = computed(() =>
  summarizeFixedCosts(
    store.profile.fixedCosts,
    snapshot.value.workDays,
    snapshot.value.earned,
    snapshot.value.status,
  ),
)

const costMain = computed(() => {
  const next = costSummary.value
  if (!salaryReady.value) return '写月薪后就能看'
  return `¥${formatMoney(next.daily)}`
})

const costSub = computed(() => {
  const next = costSummary.value
  if (!salaryReady.value) return '每个上班日'
  if (next.rest) return '今天休息，不算进上班日'
  if (next.covered) return '已覆盖'
  return `还差 ¥${formatMoney(next.gap)}`
})

const editingMemo = ref(false)

function goTab(url: string) {
  uni.switchTab({ url })
}

function goGoods() {
  if (!salaryReady.value) {
    goTab('/pages/me/index')
    return
  }
  openCalc('goods')
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
        <text>WORK TODAY 今天也很棒</text>
      </view>
      <view class="title-row">
        <text class="date">{{ dateLabel }}</text>
        <view class="badge" :class="{ rest: resting }" @click="goTab(resting ? '/pages/calendar/index' : '/pages/me/index')">
          <view class="dot" />
          <text class="badge-text">{{ statusLabel(snapshot.status) }}</text>
        </view>
      </view>
    </view>

    <view class="hero">
      <view class="hero-copy">
        <text class="hero-kicker">{{ heroTitle(snapshot.status) }}</text>
        <text v-if="!ended" class="hero-clock">{{ clockText }}</text>
        <text
          v-else
          class="hero-clock"
          :class="{ locked: !salaryReady }"
          @click="!salaryReady && goTab('/pages/me/index')"
        >
          {{ salaryReady ? `¥${formatMoney(resting ? snapshot.monthEarned : snapshot.earned)}` : '写月薪后就能看' }}
        </text>
        <text class="hero-sub">{{ heroSubtitle(snapshot.status) }}</text>
        <view class="earn">
          <template v-if="!ended">
            <text class="earn-label">今日已赚</text>
            <text v-if="salaryReady" class="earn-value">¥{{ formatMoney(snapshot.earned) }}</text>
            <text v-else class="earn-value locked" @click="goTab('/pages/me/index')">写月薪后就能看</text>
          </template>
          <text class="month" @click="goTab(salaryReady ? '/pages/calendar/index' : '/pages/me/index')">
            已上 {{ snapshot.workedDays }} 天{{ salaryReady && !ended ? ` · ¥${formatMoney(snapshot.monthEarned)}` : '' }} ›
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
        <text>{{ store.profile.startTime }}</text>
        <text>{{ workedLabel }}</text>
        <text>{{ store.profile.endTime }}</text>
      </view>
      <text v-if="store.profile.hasLunch" class="lunch-meta">
        午休 {{ store.profile.lunchStartTime }}–{{ store.profile.lunchEndTime }}，不计工时
      </text>
    </view>

    <view class="tiles">
      <view v-if="costSummary.hasCosts" class="tile" @click="openCalc('cost')">
        <text class="tile-kicker">先赚回</text>
        <text class="tile-num" :class="{ locked: !salaryReady }">{{ costMain }}</text>
        <text class="tile-sub">{{ costSub }}</text>
      </view>
      <view v-if="costSummary.hasCosts" class="tile" @click="goGoods">
        <text class="tile-kicker">今天能换</text>
        <text class="tile-num" :class="{ locked: !salaryReady }">
          {{ salaryReady ? `${coffeeCount} ${store.coffee.unit}` : '写月薪后就能看' }}
        </text>
        <text class="tile-sub">{{ store.coffee.name }}</text>
      </view>
      <view v-if="!costSummary.hasCosts" class="tile" @click="goGoods">
        <text class="tile-kicker">{{ store.coffee.name }}</text>
        <text class="tile-num" :class="{ locked: !salaryReady }">
          {{ salaryReady ? `${coffeeCount} ${store.coffee.unit}` : '写月薪后就能看' }}
        </text>
        <text class="tile-sub">¥{{ store.coffee.price }}/{{ store.coffee.unit }}</text>
      </view>
      <view v-if="!costSummary.hasCosts" class="tile" @click="goGoods">
        <text class="tile-kicker">{{ store.lunch.name }}</text>
        <text class="tile-num" :class="{ locked: !salaryReady }">
          {{ salaryReady ? `${lunchCount} ${store.lunch.unit}` : '写月薪后就能看' }}
        </text>
        <text class="tile-sub">¥{{ store.lunch.price }}/{{ store.lunch.unit }}</text>
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
        <text class="card-title">小荧陪你</text>
        <text class="companion-text">{{ companionText(snapshot.status, snapshot.remaining) }}</text>
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

.hero-clock.locked {
  font-size: 34rpx;
  font-weight: 600;
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

.tiles {
  display: flex;
  margin-top: 20rpx;
}

.tile {
  flex: 1;
  padding: 28rpx 24rpx;
  margin-right: 16rpx;
  border-radius: 32rpx;
  background: #fffdf8;
  box-sizing: border-box;
}

.tile:last-child {
  margin-right: 0;
}

.tile-kicker,
.tile-sub {
  display: block;
  font-size: 22rpx;
  color: #8a8478;
}

.tile-num {
  display: block;
  margin: 12rpx 0 8rpx;
  font-size: 40rpx;
  font-weight: 700;
  line-height: 1.15;
  color: #1c1b18;
}

.tile-num.locked {
  font-size: 26rpx;
  font-weight: 600;
  color: #7c6246;
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
