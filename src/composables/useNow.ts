import { onMounted, onUnmounted, ref } from 'vue'

export function useNow(interval = 1000) {
  const now = ref(new Date())
  let timer = 0

  onMounted(() => {
    timer = window.setInterval(() => {
      now.value = new Date()
    }, interval)
  })

  onUnmounted(() => {
    window.clearInterval(timer)
  })

  return now
}
