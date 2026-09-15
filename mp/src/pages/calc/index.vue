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
import type { GoodsItem } from '../../types'
import { formatDuration, formatMoney } from '../../utils/work'

const store = useProfileStore()
const { snapshot } = useWorkDay()
const salaryReady = computed(() => store.profile.salaryReady)
const editing = ref(false)

function goMe() {
  uni.switchTab({ url: '/pages/me/index' })
}
const draft = ref<GoodsItem[]>(store.profile.goods.map((item) => ({ ...item })))
const priceTexts = ref(store.profile.goods.map((item) => String(item.price)))

function syncDraft() {
  draft.value = store.profile.goods.map((item) => ({ ...item }))
  priceTexts.value = store.profile.goods.map((item) => String(item.price))
}

const source = computed(() => (editing.value ? draft.value : store.profile.goods))

function workTimeLabel(price: number): string {
  const second = snapshot.value.wage.second
  const seconds = price / Math.max(second, 1e-9)
  if (seconds < 60) return '不到1分钟'
  return formatDuration(seconds)
}

const items = computed(() =>
  source.value.map((item, index) => {
    const raw = editing.value ? priceTexts.value[index] : item.price
    const price = Math.max(0, Number(raw) || 0)
    return {
      ...item,
      count: (snapshot.value.earned / Math.max(1, price || 1)).toFixed(1),
      workLabel: `一${item.unit}要上班 ${workTimeLabel(price)}`,
    }
  }),
)

const invalid = computed(() =>
  priceTexts.value.some((text) => !(Number(text) > 0)) ? '请填写有效单价' : '',
)

function persist() {
  if (invalid.value) return
  store.save({
    ...store.profile,
    goods: draft.value.map((item, index) => ({
      ...item,
      price: Number(priceTexts.value[index]) || 1,
    })),
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
  syncDraft()
  editing.value = true
}

function onPrice(index: number, e: { detail: { value: string } }) {
  if (!editing.value) return
  const texts = [...priceTexts.value]
  texts[index] = e.detail.value
  priceTexts.value = texts
}

onHide(() => {
  if (!editing.value) return
  syncDraft()
  editing.value = false
})
</script>

<template>
  <view class="page">
    <text class="eyebrow">CALCULATOR</text>
    <text class="title">全部换算</text>
    <text class="lead">按今日已赚换算，工时按你的班次估。要改单价先点编辑，点完成才会存到本地。</text>

    <view class="card highlight" @click="!salaryReady && goMe()">
      <text class="muted">今日已赚</text>
      <text class="big">{{ salaryReady ? `¥${formatMoney(snapshot.earned)}` : '写月薪后就能看' }}</text>
    </view>

    <view class="card" :class="{ editing }">
      <view class="form-head">
        <text class="form-title">{{ editing ? '点完成存到本地' : '能换多少 · 要上多久' }}</text>
        <view class="edit-btn" @click="toggleEdit">
          <text>{{ editing ? '完成' : '编辑' }}</text>
        </view>
      </view>
      <view v-for="(item, index) in items" :key="item.id" class="row">
        <view class="meta">
          <text class="name">{{ item.name }}</text>
          <view v-if="editing" class="input-wrap">
            <input
              type="digit"
              :value="priceTexts[index]"
              :cursor-spacing="32"
              adjust-position
              @input="onPrice(index, $event)"
            />
          </view>
          <text v-else class="muted">¥{{ item.price }}/{{ item.unit }}</text>
        </view>
        <view class="result" @click="!salaryReady && goMe()">
          <text class="big">{{ salaryReady ? `${item.count} ${item.unit}` : '写月薪后就能看' }}</text>
          <text v-if="salaryReady" class="muted">{{ item.workLabel }}</text>
        </view>
      </view>
      <text v-if="editing && invalid" class="error">{{ invalid }}</text>
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

.form-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8rpx;
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

.result {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.result .muted {
  margin-top: 8rpx;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 0;
  border-bottom: 1px solid #efe8db;
}

.row:last-of-type {
  border-bottom: none;
  padding-bottom: 0;
}

.meta {
  flex: 1;
  margin-right: 16rpx;
}

.name {
  display: block;
  margin-bottom: 6rpx;
  font-size: 30rpx;
  font-weight: 700;
  color: #1c1b18;
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

.error {
  display: block;
  margin-top: 16rpx;
  color: #9a4a32;
  font-size: 24rpx;
}
</style>
