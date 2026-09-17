import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { FixedCost, GoodsItem, Profile, WeekendRule } from '../types'
import { dateKey, isOfficialOffDay, normalizeWeekendRule, restScheduleFrom } from '../utils/work'

const STORAGE_KEY = 'work-today-profile-v1'
const MAX_FIXED_COSTS = 5

function cloneFixedCosts(items: FixedCost[] = []): FixedCost[] {
  return items.slice(0, MAX_FIXED_COSTS).map((item) => ({ ...item }))
}

function normalizeFixedCosts(raw: unknown): FixedCost[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((item): item is FixedCost => {
      if (!item || typeof item !== 'object') return false
      const next = item as Partial<FixedCost>
      return typeof next.id === 'string' && typeof next.name === 'string' && Number(next.price) >= 0
    })
    .slice(0, MAX_FIXED_COSTS)
    .map((item) => ({
      id: item.id,
      name: item.name.trim().slice(0, 16),
      price: Number(item.price) || 0,
    }))
}

export const defaultGoods: GoodsItem[] = [
  { id: 'coffee', name: '咖啡', price: 15, unit: '杯' },
  { id: 'lunch', name: '午餐', price: 35, unit: '份' },
]

export const defaultProfile: Profile = {
  monthlySalary: 12223,
  workDaysPerMonth: 22,
  startTime: '09:00',
  endTime: '19:00',
  lunchStartTime: '12:00',
  lunchEndTime: '13:00',
  hasLunch: true,
  memo: '今天要汇报王总的方案',
  goods: defaultGoods,
  fixedCosts: [],
  offDates: [],
  workDates: [],
  weekendRule: 'double',
  bigWeekAnchor: '',
}

function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaultProfile, goods: defaultGoods.map((item) => ({ ...item })), fixedCosts: [] }
    const parsed = JSON.parse(raw) as Partial<Profile>
    return {
      ...defaultProfile,
      ...parsed,
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
      fixedCosts: normalizeFixedCosts(parsed.fixedCosts),
      hasLunch: parsed.hasLunch !== false,
      weekendRule: normalizeWeekendRule(parsed.weekendRule),
      bigWeekAnchor: typeof parsed.bigWeekAnchor === 'string' ? parsed.bigWeekAnchor : '',
    }
  } catch {
    return { ...defaultProfile, goods: defaultGoods.map((item) => ({ ...item })), fixedCosts: [] }
  }
}

export const useProfileStore = defineStore('profile', () => {
  const profile = ref<Profile>(loadProfile())

  watch(
    profile,
    (value) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    },
    { deep: true },
  )

  const coffee = computed(() => profile.value.goods[0])
  const lunch = computed(() => profile.value.goods[1])

  function save(next: Profile) {
    profile.value = {
      ...next,
      goods: next.goods.map((item) => ({ ...item })),
      fixedCosts: cloneFixedCosts(next.fixedCosts ?? profile.value.fixedCosts),
      hasLunch: next.hasLunch !== false,
      offDates: Array.isArray(next.offDates) ? [...next.offDates] : [...profile.value.offDates],
      workDates: Array.isArray(next.workDates) ? [...next.workDates] : [...profile.value.workDates],
      weekendRule: normalizeWeekendRule(next.weekendRule ?? profile.value.weekendRule),
      bigWeekAnchor: typeof next.bigWeekAnchor === 'string' ? next.bigWeekAnchor : profile.value.bigWeekAnchor,
    }
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
      fixedCosts: [],
      offDates: [],
      workDates: [],
    })
  }

  return { profile, coffee, lunch, save, setDateOff, setWeekendRule, setThisWeekBig, reset }
})
