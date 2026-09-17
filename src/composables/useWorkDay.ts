import { computed } from 'vue'
import { useProfileStore } from '../stores/profile'
import { computeWorkDay } from '../utils/work'
import { useNow } from './useNow'

export function useWorkDay() {
  const now = useNow()
  const store = useProfileStore()
  const snapshot = computed(() => computeWorkDay(now.value, store.profile))
  return { now, snapshot }
}
