import { computed } from 'vue'
import { useNow } from './useNow'
import { useProfileStore } from '../stores/profile'
import { computeWorkDay } from '../utils/work'

export function useWorkDay() {
  const now = useNow()
  const store = useProfileStore()

  const snapshot = computed(() => computeWorkDay(now.value, store.profile))

  return { now, snapshot }
}
