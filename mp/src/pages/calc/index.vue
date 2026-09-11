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
import { computed } from 'vue'
import { useWorkDay } from '../../composables/useWorkDay'
import { useProfileStore } from '../../stores/profile'
import { formatMoney } from '../../utils/work'

const store = useProfileStore()
const { snapshot } = useWorkDay()

const items = computed(() =>
  store.profile.goods.map((item) => ({
    ...item,
    count: (snapshot.value.earned / item.price).toFixed(1),
  })),
)
</script>

<template>
  <view class="page">
    <text class="eyebrow">CALCULATOR</text>
    <text class="title">全部换算</text>
    <text class="lead">一期先按今日已赚换算。加班、自定义商品会放到二期。</text>

    <view class="card highlight">
      <text class="muted">今日已赚</text>
      <text class="big">¥{{ formatMoney(snapshot.earned) }}</text>
    </view>

    <view class="card">
      <view v-for="item in items" :key="item.id" class="row">
        <view>
          <text class="name">{{ item.name }}</text>
          <text class="muted">¥{{ item.price }}/{{ item.unit }}</text>
        </view>
        <text class="big">{{ item.count }} {{ item.unit }}</text>
      </view>
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

.lead {
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

.highlight {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.muted {
  display: block;
  font-size: 24rpx;
  color: #8a8478;
}

.big {
  font-size: 44rpx;
  font-weight: 700;
  color: #1c1b18;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 0;
  border-bottom: 1px solid #efe8db;
}

.row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.row:first-child {
  padding-top: 0;
}

.name {
  display: block;
  margin-bottom: 6rpx;
  font-size: 30rpx;
  font-weight: 700;
  color: #1c1b18;
}
</style>
