import { ref } from 'vue'

export type CalcTab = 'goods' | 'cost' | 'stuff'

const pending = ref<CalcTab | null>(null)

export function openCalc(tab: CalcTab) {
  pending.value = tab
  uni.switchTab({ url: '/pages/calc/index' })
}

export function consumeCalcTab(): CalcTab | null {
  const next = pending.value
  pending.value = null
  return next
}
