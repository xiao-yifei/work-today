import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { GoodsItem, Profile } from '../types'

const STORAGE_KEY = 'work-today-profile-v1'

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
  memo: '今天要汇报王总的方案',
  goods: defaultGoods,
}

function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaultProfile, goods: defaultGoods.map((item) => ({ ...item })) }
    const parsed = JSON.parse(raw) as Partial<Profile>
    return {
      ...defaultProfile,
      ...parsed,
      goods:
        parsed.goods?.length === 2
          ? parsed.goods.map((item, index) => ({ ...defaultGoods[index], ...item }))
          : defaultGoods.map((item) => ({ ...item })),
    }
  } catch {
    return { ...defaultProfile, goods: defaultGoods.map((item) => ({ ...item })) }
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
    }
  }

  function reset() {
    save(defaultProfile)
  }

  return { profile, coffee, lunch, save, reset }
})
