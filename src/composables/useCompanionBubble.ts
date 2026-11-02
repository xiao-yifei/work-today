import { onHide } from '@dcloudio/uni-app';
import { onUnmounted, ref, watch, type ComputedRef } from 'vue';
import {
  hideCompanion,
  isCompanionVisible,
  loadCompanion,
  subscribeCompanionShow,
} from '../utils/arkCompanion';

export function useCompanionBubble(
  scene: ComputedRef<{ key: string; brief: string; fallback: string }>,
) {
  const text = ref(scene.value.fallback)
  let visit = 0
  let sentKey = ''
  let queued = false
  let forceQueued = false

  function flush() {
    queued = false
    const force = forceQueued
    forceQueued = false
    if (!isCompanionVisible()) return
    const current = scene.value
    if (!force && current.key === sentKey) return
    sentKey = current.key
    const ticket = ++visit
    void loadCompanion(current, current.fallback).then((line) => {
      if (ticket !== visit) return
      text.value = line
    })
  }

  function schedule(force: boolean) {
    forceQueued = forceQueued || force
    if (queued) return
    queued = true
    Promise.resolve().then(flush)
  }

  const stop = subscribeCompanionShow(() => schedule(true))
  onHide(hideCompanion)
  onUnmounted(stop)

  watch(
    () => scene.value.key,
    () => {
      if (!isCompanionVisible()) return
      schedule(false)
    },
  )

  return text
}
