import { computed } from 'vue'
import { useProfileStore } from '../stores/profile'
import { computeWorkDay } from '../utils/work'
import { useNow } from './useNow'

export function useWorkDay() {
  const now = useNow()
  const store = useProfileStore()
  const snapshot = computed(() => computeWorkDay(now.value, store.profile))
  const afterCosts = computed(() => store.profile.showAfterCosts && snapshot.value.hasFixedCosts)
  const view = computed(() => ({
    afterCosts: afterCosts.value,
    wage: afterCosts.value ? snapshot.value.netWage : snapshot.value.wage,
    earned: afterCosts.value ? snapshot.value.netEarned : snapshot.value.earned,
    monthEarned: afterCosts.value ? snapshot.value.netMonthEarned : snapshot.value.monthEarned,
    daily: afterCosts.value ? snapshot.value.netDaily : snapshot.value.daily,
  }))
  return { now, snapshot, afterCosts, view }
}
