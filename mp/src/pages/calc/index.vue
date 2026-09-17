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
import { onHide, onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import { consumeCalcTab, type CalcTab } from '../../composables/useCalcTab'
import { useWorkDay } from '../../composables/useWorkDay'
import { useProfileStore } from '../../stores/profile'
import type { FixedCost, GoodsItem, OwnedItem } from '../../types'
import { dailyFixedShare, formatDuration, formatMoney, resolveWorkSpan, restScheduleFrom } from '../../utils/work'

const MAX_BELONGINGS = 5
const MAX_FIXED_COSTS = 5
const TABS: { id: CalcTab; label: string }[] = [
  { id: 'cost', label: '先赚回' },
  { id: 'goods', label: '今天能换' },
  { id: 'stuff', label: '想买的' },
]

const store = useProfileStore()
const { now, snapshot } = useWorkDay()
const salaryReady = computed(() => store.profile.salaryReady)
const tab = ref<CalcTab>('cost')
const tabIndex = computed(() => Math.max(0, TABS.findIndex((item) => item.id === tab.value)))
const thumbStyle = computed(() => ({
  transform: `translateX(${tabIndex.value * 100}%)`,
}))
const editing = ref(false)

function goMe() {
  uni.switchTab({ url: '/pages/me/index' })
}

function discardEdits() {
  if (editing.value) {
    syncDraft()
    editing.value = false
  }
  if (editingStuff.value) {
    syncStuff()
    editingStuff.value = false
  }
  if (editingCost.value) {
    syncCost()
    editingCost.value = false
  }
  if (addOpen.value) closeAdd()
}

function setTab(next: CalcTab) {
  if (tab.value === next) return
  discardEdits()
  tab.value = next
}

onShow(() => {
  const next = consumeCalcTab()
  if (next) {
    discardEdits()
    tab.value = next
  }
})

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
      workLabel: `一${item.unit}要上 ${workTimeLabel(price)}`,
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

interface StuffDraft {
  id: string
  name: string
  priceText: string
}

const editingStuff = ref(false)
const stuffDraft = ref<StuffDraft[]>([])

function toStuffDraft(items: OwnedItem[]): StuffDraft[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    priceText: String(item.price || ''),
  }))
}

function syncStuff() {
  stuffDraft.value = toStuffDraft(store.profile.belongings)
}

const stuffRows = computed(() => {
  const source = editingStuff.value ? stuffDraft.value : toStuffDraft(store.profile.belongings)
  const daily = snapshot.value.daily
  return source.map((item) => {
    const price = Number(item.priceText)
    let daysLabel = '写月薪后就能看'
    let spanHint = ''
    if (salaryReady.value && price > 0 && daily > 0) {
      const span = resolveWorkSpan(
        price / daily,
        now.value,
        store.profile.offDates,
        store.profile.workDates,
        restScheduleFrom(store.profile),
      )
      daysLabel = span.label
      spanHint = span.hint
    } else if (salaryReady.value && !(price > 0)) {
      daysLabel = '写下价格就能看'
    }
    return {
      ...item,
      daysLabel,
      spanHint,
    }
  })
})

const stuffInvalid = computed(() => {
  if (stuffDraft.value.some((item) => !item.name.trim())) return '请填写物品名称'
  if (stuffDraft.value.some((item) => !(Number(item.priceText) > 0))) return '请填写有效价格'
  return ''
})

function persistStuff() {
  if (stuffInvalid.value) return
  store.save({
    ...store.profile,
    belongings: stuffDraft.value.map((item) => ({
      id: item.id,
      name: item.name.trim().slice(0, 16),
      price: Number(item.priceText),
    })),
  })
}

function finishStuff() {
  if (stuffInvalid.value) return false
  persistStuff()
  editingStuff.value = false
  return true
}

function toggleStuff() {
  if (editingStuff.value) {
    finishStuff()
    return
  }
  syncStuff()
  editingStuff.value = true
}

function onStuffName(index: number, e: { detail: { value: string } }) {
  if (!editingStuff.value) return
  const next = stuffDraft.value.map((item) => ({ ...item }))
  next[index].name = e.detail.value
  stuffDraft.value = next
}

function onStuffPrice(index: number, e: { detail: { value: string } }) {
  if (!editingStuff.value) return
  const next = stuffDraft.value.map((item) => ({ ...item }))
  next[index].priceText = e.detail.value
  stuffDraft.value = next
}

function removeStuff(index: number) {
  if (!editingStuff.value) return
  stuffDraft.value = stuffDraft.value.filter((_, i) => i !== index)
}

type AddKind = 'stuff' | 'cost'

const addKind = ref<AddKind>('stuff')
const addOpen = ref(false)
const addName = ref('')
const addPrice = ref('')
const addError = ref('')
const canAdd = computed(
  () => !editingStuff.value && store.profile.belongings.length < MAX_BELONGINGS,
)

function openAdd(kind: AddKind = 'stuff') {
  if (kind === 'cost' ? !canAddCost.value : !canAdd.value) return
  addKind.value = kind
  addName.value = ''
  addPrice.value = ''
  addError.value = ''
  addOpen.value = true
}

function closeAdd() {
  addOpen.value = false
  addError.value = ''
}

function onAddName(e: { detail: { value: string } }) {
  addName.value = e.detail.value
}

function onAddPrice(e: { detail: { value: string } }) {
  addPrice.value = e.detail.value
}

function confirmAdd() {
  const name = addName.value.trim().slice(0, 16)
  const price = Number(addPrice.value)
  const isCost = addKind.value === 'cost'
  if (!name) {
    addError.value = isCost ? '请填写支出名称' : '请填写物品名称'
    return
  }
  if (!(price > 0)) {
    addError.value = isCost ? '请填写每月金额' : '请填写有效价格'
    return
  }
  if (isCost) {
    if (store.profile.fixedCosts.length >= MAX_FIXED_COSTS) return
    store.save({
      ...store.profile,
      fixedCosts: [
        ...store.profile.fixedCosts,
        { id: `c-${Date.now()}`, name, price },
      ],
    })
  } else {
    if (store.profile.belongings.length >= MAX_BELONGINGS) return
    store.save({
      ...store.profile,
      belongings: [
        ...store.profile.belongings,
        { id: `b-${Date.now()}`, name, price },
      ],
    })
  }
  addOpen.value = false
}

interface CostDraft {
  id: string
  name: string
  priceText: string
}

const editingCost = ref(false)
const costDraft = ref<CostDraft[]>([])
const canAddCost = computed(
  () => !editingCost.value && store.profile.fixedCosts.length < MAX_FIXED_COSTS,
)

function toCostDraft(items: FixedCost[]): CostDraft[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    priceText: String(item.price || ''),
  }))
}

function syncCost() {
  costDraft.value = toCostDraft(store.profile.fixedCosts)
}

const costRows = computed(() => {
  const source = editingCost.value ? costDraft.value : toCostDraft(store.profile.fixedCosts)
  const workDays = snapshot.value.workDays
  return source.map((item) => {
    const price = Number(item.priceText)
    const daily = dailyFixedShare(price, workDays)
    let dailyLabel = '写月薪后就能看'
    if (salaryReady.value && price > 0 && workDays > 0) {
      dailyLabel = `¥${formatMoney(daily)}`
    } else if (salaryReady.value && !(price > 0)) {
      dailyLabel = '写下金额就能看'
    }
    return {
      ...item,
      dailyLabel,
    }
  })
})

const costMonthly = computed(() =>
  costRows.value.reduce((sum, item) => sum + (Number(item.priceText) || 0), 0),
)

const costDaily = computed(() => dailyFixedShare(costMonthly.value, snapshot.value.workDays))

const costCover = computed(() => {
  if (!salaryReady.value || !(costMonthly.value > 0)) return ''
  if (snapshot.value.status === 'off') return '今天休息，不算进上班日'
  const gap = Math.max(0, costDaily.value - snapshot.value.earned)
  if (gap <= 0) return '今天的固定支出已覆盖'
  return `还差 ¥${formatMoney(gap)} · 还要上 ${workTimeLabel(gap)}`
})

const costCoverWidth = computed(() => {
  if (!salaryReady.value || !(costDaily.value > 0) || snapshot.value.status === 'off') return '0%'
  return `${Math.min(100, (snapshot.value.earned / costDaily.value) * 100)}%`
})

const costInvalid = computed(() => {
  if (costDraft.value.some((item) => !item.name.trim())) return '请填写支出名称'
  if (costDraft.value.some((item) => !(Number(item.priceText) > 0))) return '请填写每月金额'
  return ''
})

function persistCost() {
  if (costInvalid.value) return
  store.save({
    ...store.profile,
    fixedCosts: costDraft.value.map((item) => ({
      id: item.id,
      name: item.name.trim().slice(0, 16),
      price: Number(item.priceText),
    })),
  })
}

function finishCost() {
  if (costInvalid.value) return false
  persistCost()
  editingCost.value = false
  return true
}

function toggleCost() {
  if (editingCost.value) {
    finishCost()
    return
  }
  syncCost()
  editingCost.value = true
}

function onCostName(index: number, e: { detail: { value: string } }) {
  if (!editingCost.value) return
  const next = costDraft.value.map((item) => ({ ...item }))
  next[index].name = e.detail.value
  costDraft.value = next
}

function onCostPrice(index: number, e: { detail: { value: string } }) {
  if (!editingCost.value) return
  const next = costDraft.value.map((item) => ({ ...item }))
  next[index].priceText = e.detail.value
  costDraft.value = next
}

function removeCost(index: number) {
  if (!editingCost.value) return
  costDraft.value = costDraft.value.filter((_, i) => i !== index)
}

onHide(() => {
  discardEdits()
})
</script>

<template>
  <view class="page">
    <view class="eyebrow">
      <text>CALCULATOR</text>
    </view>
    <text class="title">换算</text>
    <view class="tabs">
      <view class="tab-thumb" :style="thumbStyle" />
      <view
        v-for="item in TABS"
        :key="item.id"
        class="tab"
        :class="{ on: tab === item.id }"
        @click="setTab(item.id)"
      >
        <text>{{ item.label }}</text>
      </view>
    </view>

    <view :key="tab" class="pane">
    <view v-if="tab === 'goods'">
      <view class="toolbar">
        <text class="earned" @click="!salaryReady && goMe()">
          {{ salaryReady ? `按今日 ¥${formatMoney(snapshot.earned)}` : '写下月薪后就能换算' }}
        </text>
        <view class="edit-btn" @click="toggleEdit">
          <text>{{ editing ? '完成' : '编辑' }}</text>
        </view>
      </view>
      <view class="tiles">
        <view v-for="(item, index) in items" :key="item.id" class="tile">
          <text class="tile-name">{{ item.name }}</text>
          <view v-if="editing" class="input-wrap">
            <input
              type="digit"
              :value="priceTexts[index]"
              :cursor-spacing="32"
              adjust-position
              @input="onPrice(index, $event)"
            />
          </view>
          <text v-else class="tile-price">¥{{ item.price }}/{{ item.unit }}</text>
          <text
            class="tile-count"
            :class="{ locked: !salaryReady }"
            @click="!salaryReady && goMe()"
          >
            {{ salaryReady ? `${item.count} ${item.unit}` : '写月薪后就能看' }}
          </text>
          <text v-if="salaryReady" class="tile-work">{{ item.workLabel }}</text>
        </view>
      </view>
      <text v-if="editing && invalid" class="error">{{ invalid }}</text>
    </view>

    <view v-else-if="tab === 'cost'">
      <view v-if="costRows.length || editingCost" class="toolbar">
        <text class="earned">摊到每个上班日</text>
        <view class="edit-btn" @click="toggleCost">
          <text>{{ editingCost ? '完成' : '编辑' }}</text>
        </view>
      </view>

      <view v-if="costRows.length" class="hero" @click="!salaryReady && goMe()">
        <text class="hero-kicker">每个上班日先赚回</text>
        <text class="hero-num" :class="{ locked: !salaryReady }">{{ salaryReady ? `¥${formatMoney(costDaily)}` : '写月薪后就能看' }}</text>
        <view class="bar">
          <view class="bar-fill" :style="{ width: costCoverWidth }" />
        </view>
        <text v-if="salaryReady && costCover" class="hero-sub">{{ costCover }}</text>
        <text v-else-if="!salaryReady" class="hero-sub">写月薪后就能看覆盖进度</text>
        <text v-if="costMonthly > 0" class="hero-month">本月合计 ¥{{ formatMoney(costMonthly, 0) }}</text>
      </view>

      <view v-if="!costRows.length && !editingCost" class="empty" @click="openAdd('cost')">
        <text class="empty-title">加上房租或通勤</text>
        <text class="empty-sub">看今天先要赚回多少</text>
      </view>

      <view v-if="costRows.length || editingCost" class="card">
        <view v-for="(item, index) in costRows" :key="item.id" class="row">
          <view class="meta">
            <input
              v-if="editingCost"
              class="name-input"
              type="text"
              maxlength="16"
              placeholder="名称"
              :value="costDraft[index].name"
              :cursor-spacing="32"
              adjust-position
              @input="onCostName(index, $event)"
            />
            <text v-else class="name">{{ item.name }}</text>
            <view v-if="editingCost" class="input-wrap">
              <input
                type="digit"
                placeholder="每月金额"
                :value="costDraft[index].priceText"
                :cursor-spacing="32"
                adjust-position
                @input="onCostPrice(index, $event)"
              />
            </view>
            <text v-else class="muted">¥{{ formatMoney(Number(item.priceText) || 0, 0) }}/月</text>
          </view>
          <view class="result">
            <text v-if="editingCost" class="remove" @click.stop="removeCost(index)">删除</text>
            <text v-else class="row-num" @click="!salaryReady && goMe()">{{ item.dailyLabel }}</text>
          </view>
        </view>
        <view v-if="canAddCost" class="add" @click="openAdd('cost')">
          <text>+ 加一项</text>
        </view>
        <text v-if="editingCost && costInvalid" class="error">{{ costInvalid }}</text>
      </view>
    </view>

    <view v-else>
      <view v-if="stuffRows.length || editingStuff" class="toolbar">
        <text class="earned">一件要上几天班</text>
        <view class="edit-btn" @click="toggleStuff">
          <text>{{ editingStuff ? '完成' : '编辑' }}</text>
        </view>
      </view>

      <view v-if="!stuffRows.length && !editingStuff" class="empty" @click="openAdd('stuff')">
        <text class="empty-title">想买的东西，换成要上几天班</text>
        <text class="empty-sub">最多 5 件，点这里加上</text>
      </view>

      <view v-for="(item, index) in stuffRows" :key="item.id" class="ticket">
        <view class="ticket-top">
          <view class="meta">
            <input
              v-if="editingStuff"
              class="name-input"
              type="text"
              maxlength="16"
              placeholder="名称"
              :value="stuffDraft[index].name"
              :cursor-spacing="32"
              adjust-position
              @input="onStuffName(index, $event)"
            />
            <text v-else class="name">{{ item.name }}</text>
            <view v-if="editingStuff" class="input-wrap">
              <input
                type="digit"
                placeholder="价格"
                :value="stuffDraft[index].priceText"
                :cursor-spacing="32"
                adjust-position
                @input="onStuffPrice(index, $event)"
              />
            </view>
            <text v-else class="muted">¥{{ formatMoney(Number(item.priceText) || 0, 0) }}</text>
          </view>
          <text v-if="editingStuff" class="remove" @click.stop="removeStuff(index)">删除</text>
        </view>
        <text class="ticket-kicker">要上</text>
        <text class="ticket-days" :class="{ locked: !salaryReady }" @click="!salaryReady && goMe()">
          {{ item.daysLabel }}
        </text>
        <text v-if="item.spanHint" class="muted">{{ item.spanHint }}</text>
      </view>
      <view v-if="canAdd" class="add" @click="openAdd('stuff')">
        <text>+ 加一件</text>
      </view>
      <text v-if="editingStuff && stuffInvalid" class="error">{{ stuffInvalid }}</text>
    </view>
    </view>

    <view v-if="addOpen" class="overlay" @click="closeAdd" @touchmove.stop.prevent>
      <view class="dialog" @click.stop>
        <text class="dialog-title">{{ addKind === 'cost' ? '加一项' : '加一件' }}</text>
        <input
          class="name-input"
          type="text"
          maxlength="16"
          placeholder="名称"
          :focus="addOpen"
          :value="addName"
          :cursor-spacing="32"
          adjust-position
          @input="onAddName"
        />
        <view class="input-wrap">
          <input
            type="digit"
            :placeholder="addKind === 'cost' ? '每月金额' : '价格'"
            :value="addPrice"
            :cursor-spacing="32"
            adjust-position
            @input="onAddPrice"
          />
        </view>
        <text v-if="addError" class="error">{{ addError }}</text>
        <view class="dialog-actions">
          <view class="ghost-btn" @click="closeAdd">
            <text>取消</text>
          </view>
          <view class="edit-btn" @click="confirmAdd">
            <text>加上</text>
          </view>
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

.tabs {
  position: relative;
  display: flex;
  margin-top: 24rpx;
  padding: 6rpx;
  border-radius: 24rpx;
  background: #efe8db;
  overflow: hidden;
}

.tab-thumb {
  position: absolute;
  top: 6rpx;
  left: 6rpx;
  width: calc((100% - 12rpx) / 3);
  height: 64rpx;
  border-radius: 20rpx;
  background: #2b2a26;
  transition: transform 0.28s cubic-bezier(0.32, 0.72, 0, 1);
}

.tab {
  position: relative;
  z-index: 1;
  flex: 1;
  height: 64rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tab text {
  font-size: 24rpx;
  color: #6d675c;
  transition: color 0.2s ease;
}

.tab.on text {
  color: #f6f1e8;
}

.pane {
  animation: pane-in 0.28s ease;
}

@keyframes pane-in {
  from {
    opacity: 0;
    transform: translateY(12rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 28rpx 0 20rpx;
}

.earned {
  flex: 1;
  margin-right: 16rpx;
  font-size: 24rpx;
  color: #8a8478;
}

.edit-btn {
  flex-shrink: 0;
  height: 56rpx;
  padding: 0 24rpx;
  border-radius: 28rpx;
  background: #2b2a26;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-btn text {
  color: #f6f1e8;
  font-size: 22rpx;
}

.tiles {
  display: flex;
}

.tile {
  flex: 1;
  min-height: 280rpx;
  padding: 28rpx 24rpx;
  margin-right: 16rpx;
  border-radius: 32rpx;
  background: #fffdf8;
  box-sizing: border-box;
}

.tile:last-child {
  margin-right: 0;
}

.tile-name {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #1c1b18;
}

.tile-price,
.tile-work {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #8a8478;
}

.tile-count {
  display: block;
  margin-top: 28rpx;
  font-size: 48rpx;
  font-weight: 700;
  line-height: 1.15;
  color: #1c1b18;
}

.tile-count.locked,
.ticket-days.locked {
  font-size: 28rpx;
  font-weight: 600;
  color: #7c6246;
}

.hero-num.locked {
  font-size: 34rpx;
  font-weight: 600;
}

.hero {
  padding: 36rpx 32rpx 32rpx;
  border-radius: 40rpx;
  background: #2b2a26;
}

.hero-kicker,
.hero-sub,
.hero-month {
  display: block;
  color: rgba(246, 241, 232, 0.62);
  font-size: 22rpx;
}

.hero-num {
  display: block;
  margin: 10rpx 0 28rpx;
  color: #f6f1e8;
  font-size: 64rpx;
  font-weight: 700;
  line-height: 1.1;
}

.bar {
  height: 16rpx;
  border-radius: 16rpx;
  background: rgba(246, 241, 232, 0.16);
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 16rpx;
  background: #d7c16a;
}

.hero-sub {
  margin-top: 16rpx;
  color: rgba(246, 241, 232, 0.78);
}

.hero-month {
  margin-top: 8rpx;
}

.card {
  margin-top: 20rpx;
  padding: 8rpx 28rpx 28rpx;
  border-radius: 32rpx;
  background: #fffdf8;
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

.muted {
  display: block;
  font-size: 22rpx;
  color: #8a8478;
}

.row-num {
  font-size: 36rpx;
  font-weight: 700;
  color: #1c1b18;
}

.result {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.ticket {
  margin-top: 16rpx;
  padding: 28rpx;
  border-radius: 32rpx;
  background: #fffdf8;
}

.ticket-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.ticket-kicker {
  display: block;
  font-size: 22rpx;
  color: #8a8478;
}

.ticket-days {
  display: block;
  margin-top: 8rpx;
  font-size: 48rpx;
  font-weight: 700;
  line-height: 1.15;
  color: #1c1b18;
}

.empty {
  margin-top: 28rpx;
  padding: 56rpx 32rpx;
  border-radius: 32rpx;
  background: #fffdf8;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.empty-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #1c1b18;
  text-align: center;
}

.empty-sub {
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #8a8478;
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

.name-input {
  width: 100%;
  height: 72rpx;
  margin-bottom: 8rpx;
  padding: 0 20rpx;
  border-radius: 16rpx;
  background: #f7f3eb;
  color: #1c1b18;
  font-size: 28rpx;
  box-sizing: border-box;
}

.remove {
  font-size: 22rpx;
  color: #9a4a32;
}

.add {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 72rpx;
  margin-top: 16rpx;
  border-radius: 16rpx;
  background: #f6f1e8;
}

.add text {
  font-size: 26rpx;
  color: #7c6246;
}

.error {
  display: block;
  margin-top: 16rpx;
  color: #9a4a32;
  font-size: 24rpx;
}

.overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48rpx 40rpx;
  background: rgba(28, 27, 24, 0.4);
  box-sizing: border-box;
}

.dialog {
  width: 100%;
  padding: 36rpx 28rpx 28rpx;
  border-radius: 32rpx;
  background: #fffdf8;
  box-sizing: border-box;
}

.dialog-title {
  display: block;
  margin-bottom: 24rpx;
  font-size: 32rpx;
  font-weight: 700;
  color: #1c1b18;
}

.dialog .name-input {
  margin-bottom: 16rpx;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 28rpx;
}

.dialog-actions .edit-btn,
.ghost-btn {
  display: flex;
  align-items: center;
  justify-content: center;
}

.ghost-btn {
  height: 56rpx;
  padding: 0 24rpx;
  margin-right: 16rpx;
  border-radius: 28rpx;
  background: #f6f1e8;
}

.ghost-btn text {
  color: #7c6246;
  font-size: 22rpx;
}
</style>
