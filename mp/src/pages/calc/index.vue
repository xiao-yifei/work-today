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
import type { FixedCost, GoodsItem, OwnedItem } from '../../types'
import { dailyFixedShare, formatDuration, formatMoney, resolveWorkSpan, restScheduleFrom } from '../../utils/work'

const MAX_BELONGINGS = 5
const MAX_FIXED_COSTS = 5

const store = useProfileStore()
const { now, snapshot } = useWorkDay()
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
    let workLabel = ''
    if (salaryReady.value && price > 0 && workDays > 0) {
      dailyLabel = `¥${formatMoney(daily)}`
      workLabel = `每个上班日 · 要上班 ${workTimeLabel(daily)}`
    } else if (salaryReady.value && !(price > 0)) {
      dailyLabel = '写下金额就能看'
    }
    return {
      ...item,
      dailyLabel,
      workLabel,
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
  return `还差 ¥${formatMoney(gap)} · 还要上班 ${workTimeLabel(gap)}`
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
})
</script>

<template>
  <view class="page">
    <text class="eyebrow">CALCULATOR</text>
    <text class="title">全部换算</text>
    <text class="lead">按今日已赚换算，也能看看固定支出摊到每个上班日多少。</text>

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

    <view class="card" :class="{ editing: editingCost }">
      <view class="form-head">
        <text class="form-title">{{ editingCost ? '点完成存到本地' : '固定支出' }}</text>
        <view v-if="editingCost || costRows.length" class="edit-btn" @click="toggleCost">
          <text>{{ editingCost ? '完成' : '编辑' }}</text>
        </view>
      </view>
      <text class="hint">摊到每个上班日，看今天先要赚回多少。房租、停车费都可以。</text>
      <view v-if="costRows.length" class="cost-sum" @click="!salaryReady && goMe()">
        <view>
          <text class="muted">本月合计</text>
          <text class="big">¥{{ formatMoney(costMonthly, 0) }}</text>
        </view>
        <view class="result">
          <text class="big">{{ salaryReady ? `¥${formatMoney(costDaily)}` : '写月薪后就能看' }}</text>
          <text v-if="salaryReady" class="muted">每个上班日</text>
          <text v-if="costCover" class="muted">{{ costCover }}</text>
        </view>
      </view>
      <view v-if="!costRows.length && !editingCost" class="empty">
        还没有固定支出。点加一项。
      </view>
      <view v-for="(item, index) in costRows" :key="item.id" class="row stuff-row">
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
        <view class="result" @click="!salaryReady && goMe()">
          <text class="big">{{ item.dailyLabel }}</text>
          <text v-if="editingCost" class="remove" @click.stop="removeCost(index)">删除</text>
          <text v-else-if="item.workLabel" class="muted">{{ item.workLabel }}</text>
        </view>
      </view>
      <view v-if="canAddCost" class="add" @click="openAdd('cost')">
        <text>+ 加一项</text>
      </view>
      <text v-if="editingCost && costInvalid" class="error">{{ costInvalid }}</text>
    </view>

    <view class="card" :class="{ editing: editingStuff }">
      <view class="form-head">
        <text class="form-title">{{ editingStuff ? '点完成存到本地' : '我的物品' }}</text>
        <view v-if="editingStuff || stuffRows.length" class="edit-btn" @click="toggleStuff">
          <text>{{ editingStuff ? '完成' : '编辑' }}</text>
        </view>
      </view>
      <text class="hint">一件东西值多少，要上几天班才拥有。</text>
      <view v-if="!stuffRows.length && !editingStuff" class="empty">
        还没有物品。点加一件。
      </view>
      <view v-for="(item, index) in stuffRows" :key="item.id" class="row stuff-row">
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
        <view class="result" @click="!salaryReady && goMe()">
          <text class="big">{{ item.daysLabel }}</text>
          <text v-if="editingStuff" class="remove" @click.stop="removeStuff(index)">删除</text>
          <text v-else-if="item.spanHint" class="muted">{{ item.spanHint }}</text>
        </view>
      </view>
      <view v-if="canAdd" class="add" @click="openAdd('stuff')">
        <text>+ 加一件</text>
      </view>
      <text v-if="editingStuff && stuffInvalid" class="error">{{ stuffInvalid }}</text>
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

.highlight .big {
  font-size: 44rpx;
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

.hint {
  display: block;
  margin: 0 0 8rpx;
  font-size: 22rpx;
  color: #9a9488;
  line-height: 1.6;
}

.empty {
  display: block;
  margin-top: 12rpx;
  font-size: 26rpx;
  color: #8a8478;
  line-height: 1.6;
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
  margin-top: 12rpx;
  font-size: 22rpx;
  color: #9a4a32;
}

.add {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 72rpx;
  margin-top: 8rpx;
  border-radius: 16rpx;
  background: #f6f1e8;
}

.add text {
  font-size: 26rpx;
  color: #7c6246;
}

.stuff-row .big {
  font-size: 36rpx;
}

.cost-sum {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin: 12rpx 0 8rpx;
  padding: 20rpx;
  border-radius: 20rpx;
  background: #f7f3eb;
}

.cost-sum .big {
  display: block;
  margin-top: 6rpx;
  font-size: 36rpx;
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
