<script setup lang="ts">
import { computed, ref } from 'vue'
import { useWorkDay } from '../composables/useWorkDay'
import { useProfileStore } from '../stores/profile'
import type { GoodsItem } from '../types'
import { formatDuration, formatMoney } from '../utils/work'

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
</script>

<template>
  <main class="page">
    <header>
      <p class="eyebrow">CALCULATOR</p>
      <h1>全部换算</h1>
      <p class="lead">按今日已赚换算，工时按你的班次估。要改单价先点编辑，点完成才会存到本地。</p>
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

.error {
  margin: 12px 0 0;
  color: #9a4a32;
  font-size: 13px;
}
</style>
