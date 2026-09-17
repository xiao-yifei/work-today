import { onHide, onShow } from '@dcloudio/uni-app'
import { onUnmounted, ref } from 'vue'

export function useNow(interval = 1000) {
  const now = ref(new Date())
  let timer = 0

  function stop() {
    if (!timer) return
    clearInterval(timer)
    timer = 0
  }

  function start() {
    stop()
    now.value = new Date()
    timer = setInterval(() => {
      now.value = new Date()
    }, interval) as unknown as number
  }

  onShow(start)
  onHide(stop)
  onUnmounted(stop)

  return now
}
