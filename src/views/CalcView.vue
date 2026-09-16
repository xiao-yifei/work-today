<script setup lang="ts">
import { computed, ref } from 'vue'
import { useWorkDay } from '../composables/useWorkDay'
import { useProfileStore } from '../stores/profile'
import type { FixedCost, GoodsItem } from '../types'
import { dailyFixedShare, formatDuration, formatMoney } from '../utils/work'

const MAX_FIXED_COSTS = 5

const store = useProfileStore()
const { snapshot } = useWorkDay()
const editing = ref(false)
const draft = ref<GoodsItem[]>(store.profile.goods.map((item) => ({ ...item })))

function syncDraft() {
  draft.value = store.profile.goods.map((item) => ({ ...item }))
}

const source = computed(() => (editing.value ? draft.value : store.profile.goods))

function workTimeLabel(price: number): string {
  const second = snapshot.value.wage.second
  const seconds = price / Math.max(second, 1e-9)
  if (seconds < 60) return '不到1分钟'
  return formatDuration(seconds)
}

const items = computed(() =>
  source.value.map((item) => {
    const price = Math.max(0, Number(item.price) || 0)
    return {
      ...item,
      count: snapshot.value.earned / Math.max(1, price || 1),
      workLabel: `一${item.unit}要上班 ${workTimeLabel(price)}`,
    }
  }),
)

const invalid = computed(() =>
  draft.value.some((item) => !(Number(item.price) > 0)) ? '请填写有效单价' : '',
)

function persist() {
  if (invalid.value) return
  store.save({
    ...store.profile,
    goods: draft.value.map((item) => ({
      ...item,
      price: Number(item.price) || 1,
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

const editingCost = ref(false)
const costDraft = ref<FixedCost[]>([])
const addName = ref('')
const addPrice = ref('')
const addError = ref('')

function syncCost() {
  costDraft.value = store.profile.fixedCosts.map((item) => ({ ...item }))
}

const costSource = computed(() => (editingCost.value ? costDraft.value : store.profile.fixedCosts))

const costRows = computed(() =>
  costSource.value.map((item) => {
    const price = Math.max(0, Number(item.price) || 0)
    const daily = dailyFixedShare(price, snapshot.value.workDays)
    return {
      ...item,
      daily,
      dailyLabel: price > 0 ? `¥${formatMoney(daily)}` : '写下金额就能看',
      workLabel: price > 0 ? `每个上班日 · 要上班 ${workTimeLabel(daily)}` : '',
    }
  }),
)

const costMonthly = computed(() => costSource.value.reduce((sum, item) => sum + (Number(item.price) || 0), 0))
const costDaily = computed(() => dailyFixedShare(costMonthly.value, snapshot.value.workDays))
const costCover = computed(() => {
  if (!(costMonthly.value > 0)) return ''
  if (snapshot.value.status === 'off') return '今天休息，不算进上班日'
  const gap = Math.max(0, costDaily.value - snapshot.value.earned)
  if (gap <= 0) return '今天的固定支出已覆盖'
  return `还差 ¥${formatMoney(gap)} · 还要上班 ${workTimeLabel(gap)}`
})

const costInvalid = computed(() => {
  if (costDraft.value.some((item) => !item.name.trim())) return '请填写支出名称'
  if (costDraft.value.some((item) => !(Number(item.price) > 0))) return '请填写每月金额'
  return ''
})

const canAddCost = computed(
  () => !editingCost.value && store.profile.fixedCosts.length < MAX_FIXED_COSTS,
)

function persistCost() {
  if (costInvalid.value) return
  store.save({
    ...store.profile,
    fixedCosts: costDraft.value.map((item) => ({
      ...item,
      name: item.name.trim().slice(0, 16),
      price: Number(item.price) || 0,
    })),
  })
}

function toggleCost() {
  if (editingCost.value) {
    if (costInvalid.value) return
    persistCost()
    editingCost.value = false
    return
  }
  syncCost()
  editingCost.value = true
}

function removeCost(index: number) {
  if (!editingCost.value) return
  costDraft.value = costDraft.value.filter((_, i) => i !== index)
}

function confirmAdd() {
  const name = addName.value.trim().slice(0, 16)
  const price = Number(addPrice.value)
  if (!name) {
    addError.value = '请填写支出名称'
    return
  }
  if (!(price > 0)) {
    addError.value = '请填写每月金额'
    return
  }
  if (store.profile.fixedCosts.length >= MAX_FIXED_COSTS) return
  store.save({
    ...store.profile,
    fixedCosts: [...store.profile.fixedCosts, { id: `c-${Date.now()}`, name, price }],
  })
  addName.value = ''
  addPrice.value = ''
  addError.value = ''
}
</script>

<template>
  <main class="page">
    <header>
      <p class="eyebrow">CALCULATOR</p>
      <h1>全部换算</h1>
      <p class="lead">按今日已赚换算，也能看看固定支出摊到每个上班日多少。要改先点编辑，点完成才会存到本地。</p>
    </header>

    <section class="card highlight">
      <p>今日已赚</p>
      <strong>¥{{ formatMoney(snapshot.earned) }}</strong>
    </section>

    <section class="card" :class="{ editing }">
      <div class="form-head">
        <p>{{ editing ? '点完成存到本地' : '能换多少 · 要上多久' }}</p>
        <button type="button" class="edit-btn" @click="toggleEdit">
          {{ editing ? '完成' : '编辑' }}
        </button>
      </div>
      <article v-for="(item, index) in items" :key="item.id">
        <div>
          <h2>{{ item.name }}</h2>
          <input
            v-if="editing"
            v-model.number="draft[index].price"
            type="number"
            min="1"
            step="1"
            inputmode="decimal"
          />
          <p v-else>¥{{ item.price }}/{{ item.unit }}</p>
        </div>
        <div class="result">
          <strong>{{ item.count.toFixed(1) }} {{ item.unit }}</strong>
          <p>{{ item.workLabel }}</p>
        </div>
      </article>
      <p v-if="editing && invalid" class="error">{{ invalid }}</p>
    </section>

    <section class="card" :class="{ editing: editingCost }">
      <div class="form-head">
        <p>{{ editingCost ? '点完成存到本地' : '固定支出' }}</p>
        <button v-if="editingCost || costRows.length" type="button" class="edit-btn" @click="toggleCost">
          {{ editingCost ? '完成' : '编辑' }}
        </button>
      </div>
      <p class="hint">摊到每个上班日，看今天先要赚回多少。房租、停车费都可以。</p>
      <div v-if="costRows.length" class="cost-sum">
        <div>
          <p>本月合计</p>
          <strong>¥{{ formatMoney(costMonthly, 0) }}</strong>
        </div>
        <div class="result">
          <strong>¥{{ formatMoney(costDaily) }}</strong>
          <p>每个上班日</p>
          <p v-if="costCover">{{ costCover }}</p>
        </div>
      </div>
      <p v-if="!costRows.length && !editingCost" class="empty">还没有固定支出。下面加一项。</p>
      <article v-for="(item, index) in costRows" :key="item.id">
        <div>
          <input
            v-if="editingCost"
            v-model="costDraft[index].name"
            type="text"
            maxlength="16"
            placeholder="名称"
          />
          <h2 v-else>{{ item.name }}</h2>
          <input
            v-if="editingCost"
            v-model.number="costDraft[index].price"
            type="number"
            min="1"
            step="1"
            inputmode="decimal"
            placeholder="每月金额"
          />
          <p v-else>¥{{ formatMoney(item.price, 0) }}/月</p>
        </div>
        <div class="result">
          <strong>{{ item.dailyLabel }}</strong>
          <button v-if="editingCost" type="button" class="remove" @click="removeCost(index)">删除</button>
          <p v-else-if="item.workLabel">{{ item.workLabel }}</p>
        </div>
      </article>
      <div v-if="canAddCost" class="add-row">
        <input v-model="addName" type="text" maxlength="16" placeholder="名称" />
        <input v-model="addPrice" type="number" min="1" step="1" inputmode="decimal" placeholder="每月金额" />
        <button type="button" class="edit-btn" @click="confirmAdd">加上</button>
      </div>
      <p v-if="addError" class="error">{{ addError }}</p>
      <p v-if="editingCost && costInvalid" class="error">{{ costInvalid }}</p>
    </section>
  </main>
</template>

<style scoped>
.page {
  padding: 22px 18px 108px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.eyebrow {
  margin: 0 0 6px;
  font-size: 12px;
  letter-spacing: 0.08em;
  color: #8a8478;
}

h1 {
  margin: 0;
  font-size: 28px;
  color: #1c1b18;
}

.lead {
  margin: 8px 0 0;
  color: #8a8478;
  font-size: 13px;
  line-height: 1.6;
}

.card {
  background: #fffdf8;
  border-radius: 20px;
  padding: 16px;
}

.highlight {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.form-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 4px;
}

.form-head p {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #1c1b18;
}

.edit-btn {
  height: 30px;
  padding: 0 12px;
  border: none;
  border-radius: 999px;
  background: #2b2a26;
  color: #f6f1e8;
  font-size: 12px;
  font-weight: 600;
}

.highlight p,
article p {
  margin: 0;
  color: #8a8478;
  font-size: 13px;
}

.highlight strong,
article strong {
  font-size: 24px;
  color: #1c1b18;
}

.result {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.result p {
  text-align: right;
}

article {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid #efe8db;
}

article:last-of-type {
  border-bottom: 0;
  padding-bottom: 0;
}

h2 {
  margin: 0 0 4px;
  font-size: 16px;
}

article input {
  width: 120px;
  border: 1px solid #ebe4d6;
  background: #f7f3eb;
  border-radius: 12px;
  padding: 8px 12px;
  font: inherit;
  color: #1c1b18;
  box-sizing: border-box;
}

.hint,
.empty {
  margin: 0 0 8px;
  color: #9a9488;
  font-size: 12px;
  line-height: 1.6;
}

.empty {
  color: #8a8478;
  font-size: 14px;
}

.cost-sum {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin: 8px 0;
  padding: 12px;
  border-radius: 14px;
  background: #f7f3eb;
}

.cost-sum strong {
  display: block;
  margin-top: 4px;
  font-size: 20px;
}

.add-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 8px;
}

.add-row input {
  flex: 1;
  width: auto;
}

.remove {
  margin-top: 6px;
  border: none;
  background: none;
  color: #9a4a32;
  font-size: 12px;
}

.error {
  margin: 12px 0 0;
  color: #9a4a32;
  font-size: 13px;
}
</style>
