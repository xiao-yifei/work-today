import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { FixedCost, GoodsItem, OwnedItem, Profile, WeekendRule } from '../types'
import { dateKey, isOfficialOffDay, normalizeWeekendRule, restScheduleFrom } from '../utils/work'

const STORAGE_KEY = 'work-today-profile-v1'

export const defaultGoods: GoodsItem[] = [
  { id: 'coffee', name: '咖啡', price: 15, unit: '杯' },
  { id: 'lunch', name: '午餐', price: 35, unit: '份' },
]

const DEMO_MEMO = '今天要汇报王总的方案'

export const defaultProfile: Profile = {
  monthlySalary: 12223,
  workDaysPerMonth: 22,
  startTime: '09:00',
  endTime: '19:00',
  lunchStartTime: '12:00',
  lunchEndTime: '13:00',
  hasLunch: true,
  memo: '',
  goods: defaultGoods,
  belongings: [],
  fixedCosts: [],
  offDates: [],
  workDates: [],
  weekendRule: 'double',
  bigWeekAnchor: '',
  salaryReady: false,
  showAfterCosts: false,
}

const MAX_BELONGINGS = 5
const MAX_FIXED_COSTS = 5

function cloneNamedAmounts<T extends OwnedItem | FixedCost>(items: T[] = [], max: number): T[] {
  return items.slice(0, max).map((item) => ({ ...item }))
}

function normalizeNamedAmounts<T extends OwnedItem | FixedCost>(raw: unknown, max: number): T[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((item): item is T => {
      if (!item || typeof item !== 'object') return false
      const next = item as Partial<T>
      return typeof next.id === 'string' && typeof next.name === 'string' && Number(next.price) >= 0
    })
    .slice(0, max)
    .map((item) => ({
      id: item.id,
      name: item.name.trim().slice(0, 16),
      price: Number(item.price) || 0,
    })) as T[]
}

function cloneBelongings(items: OwnedItem[] = []): OwnedItem[] {
  return cloneNamedAmounts(items, MAX_BELONGINGS)
}

function normalizeBelongings(raw: unknown): OwnedItem[] {
  return normalizeNamedAmounts<OwnedItem>(raw, MAX_BELONGINGS)
}

function cloneFixedCosts(items: FixedCost[] = []): FixedCost[] {
  return cloneNamedAmounts(items, MAX_FIXED_COSTS)
}

function normalizeFixedCosts(raw: unknown): FixedCost[] {
  return normalizeNamedAmounts<FixedCost>(raw, MAX_FIXED_COSTS)
}

function emptyProfile(): Profile {
  return {
    ...defaultProfile,
    goods: defaultGoods.map((item) => ({ ...item })),
    belongings: [],
    fixedCosts: [],
  }
}

function inferSalaryReady(parsed: Partial<Profile> & { setupDone?: boolean }): boolean {
  if (parsed.salaryReady === true || parsed.setupDone === true) return true
  if (parsed.salaryReady === false) return false
  return (parsed.monthlySalary ?? defaultProfile.monthlySalary) !== defaultProfile.monthlySalary
}

function loadProfile(): Profile {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY) as string | Partial<Profile> | ''
    if (!raw) return emptyProfile()
    const parsed = (typeof raw === 'string' ? JSON.parse(raw) : raw) as Partial<Profile> & { setupDone?: boolean }
    const salaryReady = inferSalaryReady(parsed)
    const memo = typeof parsed.memo === 'string' ? parsed.memo : ''
    return {
      ...defaultProfile,
      ...parsed,
      memo: !salaryReady && memo === DEMO_MEMO ? '' : memo,
      salaryReady,
      goods:
        parsed.goods?.length === 2
          ? parsed.goods.map((item, index) => ({ ...defaultGoods[index], ...item }))
          : defaultGoods.map((item) => ({ ...item })),
      offDates: Array.isArray(parsed.offDates)
        ? parsed.offDates.filter((item): item is string => typeof item === 'string')
        : [],
      workDates: Array.isArray(parsed.workDates)
        ? parsed.workDates.filter((item): item is string => typeof item === 'string')
        : [],
      belongings: normalizeBelongings(parsed.belongings),
      fixedCosts: normalizeFixedCosts(parsed.fixedCosts),
      hasLunch: parsed.hasLunch !== false,
      weekendRule: normalizeWeekendRule(parsed.weekendRule),
      bigWeekAnchor: typeof parsed.bigWeekAnchor === 'string' ? parsed.bigWeekAnchor : '',
      showAfterCosts: parsed.showAfterCosts === true,
    }
  } catch {
    return emptyProfile()
  }
}

export const useProfileStore = defineStore('profile', () => {
  const profile = ref<Profile>(loadProfile())

  watch(
    profile,
    (value) => {
      uni.setStorageSync(STORAGE_KEY, JSON.stringify(value))
    },
    { deep: true },
  )

  const coffee = computed(() => profile.value.goods[0])
  const lunch = computed(() => profile.value.goods[1])

  function save(next: Profile) {
    profile.value = {
      ...next,
      goods: next.goods.map((item) => ({ ...item })),
      offDates: Array.isArray(next.offDates) ? [...next.offDates] : [...profile.value.offDates],
      workDates: Array.isArray(next.workDates) ? [...next.workDates] : [...profile.value.workDates],
      belongings: cloneBelongings(next.belongings ?? profile.value.belongings),
      fixedCosts: cloneFixedCosts(next.fixedCosts ?? profile.value.fixedCosts),
      weekendRule: normalizeWeekendRule(next.weekendRule ?? profile.value.weekendRule),
      bigWeekAnchor: typeof next.bigWeekAnchor === 'string' ? next.bigWeekAnchor : profile.value.bigWeekAnchor,
      hasLunch: next.hasLunch !== false,
      salaryReady: next.salaryReady,
      showAfterCosts: next.showAfterCosts === true,
    }
  }

  function setShowAfterCosts(on: boolean) {
    profile.value = { ...profile.value, showAfterCosts: on }
  }

  function setWeekendRule(rule: WeekendRule, now = new Date()) {
    const weekendRule = normalizeWeekendRule(rule)
    const bigWeekAnchor =
      weekendRule === 'bigSmall'
        ? profile.value.weekendRule === 'bigSmall' && profile.value.bigWeekAnchor
          ? profile.value.bigWeekAnchor
          : dateKey(now)
        : profile.value.bigWeekAnchor
    profile.value = { ...profile.value, weekendRule, bigWeekAnchor }
  }

  function setThisWeekBig(isBig: boolean, now = new Date()) {
    const anchor = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    if (!isBig) anchor.setDate(anchor.getDate() + 7)
    profile.value = {
      ...profile.value,
      weekendRule: 'bigSmall',
      bigWeekAnchor: dateKey(anchor),
    }
  }

  function setMemo(memo: string) {
    profile.value = { ...profile.value, memo }
  }

  function setDateOff(date: Date, off: boolean) {
    const key = dateKey(date)
    const offDates = new Set(profile.value.offDates)
    const workDates = new Set(profile.value.workDates)
    offDates.delete(key)
    workDates.delete(key)
    if (off !== isOfficialOffDay(date, restScheduleFrom(profile.value))) {
      if (off) offDates.add(key)
      else workDates.add(key)
    }
    profile.value = {
      ...profile.value,
      offDates: [...offDates],
      workDates: [...workDates],
    }
  }

  function reset() {
    save({
      ...defaultProfile,
      goods: defaultGoods.map((item) => ({ ...item })),
      belongings: [],
      fixedCosts: [],
      offDates: [],
      workDates: [],
    })
  }

  return { profile, coffee, lunch, save, setMemo, setShowAfterCosts, setDateOff, setWeekendRule, setThisWeekBig, reset }
})
