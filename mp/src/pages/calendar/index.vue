<script lang="ts">
import { onShareAppMessage, onShareTimeline, showShareMenu } from '../../utils/share';

export default {
  onShareAppMessage,
  onShareTimeline,
  onShow() {
    showShareMenu()
  },
}
</script>

<script setup lang="ts">
import { computed } from 'vue';
import { useWorkDay } from '../../composables/useWorkDay';
import { formatMoney } from '../../utils/work';

const { now, snapshot } = useWorkDay()
const monthLabel = computed(() => `${now.value.getMonth() + 1}月出勤`)
</script>

<template>
  <view class="page">
    <text class="eyebrow">CALENDAR</text>
    <text class="title">{{ monthLabel }}</text>
    <text class="lead">日历明细是二期能力。现在先按工作日估算本月累计。</text>

    <view class="card">
      <text class="muted">本月累计</text>
      <text class="big">¥{{ formatMoney(snapshot.monthEarned) }}</text>
      <text class="muted">含今日已赚 ¥{{ formatMoney(snapshot.earned) }}</text>
    </view>

    <view class="card">
      <text class="name">即将上线</text>
      <text class="lead">按天回看收入、补记加班、标记休息日。</text>
    </view>
  </view>
</template>

<style scoped>
.page {
  padding: 24rpx 32rpx;
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

.name {
  font-size: 30rpx;
  font-weight: 700;
  color: #1c1b18;
}
</style>
