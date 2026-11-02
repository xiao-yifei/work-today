import { ARK_API_KEY, ARK_MODEL } from './ark.local'

const ARK_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'

const listeners = new Set<() => void>()
let task: { abort: () => void } | null = null
let requestId = 0
let pageVisible = false

export function notifyCompanionShow() {
  pageVisible = true
  listeners.forEach((fn) => fn())
}

export function hideCompanion() {
  pageVisible = false
}

export function isCompanionVisible() {
  return pageVisible
}

export function subscribeCompanionShow(fn: () => void) {
  listeners.add(fn)
  if (pageVisible) fn()
  return () => listeners.delete(fn)
}

export function loadCompanion(
  scene: { key: string; brief: string },
  fallback: string,
): Promise<string> {
  if (!ARK_API_KEY) return Promise.resolve(fallback)
  console.log('[小芽] 请求气泡')

  const id = ++requestId
  try {
    task?.abort()
  } catch {
    /* 上一句已经结束 */
  }

  return new Promise((resolve) => {
    task = uni.request({
      url: ARK_URL,
      method: 'POST',
      timeout: 12000,
      header: {
        Authorization: `Bearer ${ARK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: {
        model: ARK_MODEL,
        thinking: { type: 'disabled' },
        max_tokens: 64,
        temperature: 0.6,
        messages: [
          {
            role: 'system',
            content:
              '你是上班陪伴角色小芽。只输出一句中文，不超过14个字。口吻软、短、不鸡血、不说教，不要引号，不要解释。',
          },
          { role: 'user', content: scene.brief },
        ],
      },
      success(res) {
        if (id !== requestId || res.statusCode !== 200) {
          if (id === requestId) console.log('[小芽] 气泡请求失败', res.statusCode)
          resolve(fallback)
          return
        }
        const line = sanitize(readContent(res.data))
        console.log('[小芽] 气泡返回', line || fallback)
        resolve(line || fallback)
      },
      fail(err) {
        if (id === requestId) console.log('[小芽] 气泡请求失败', err.errMsg || '')
        resolve(fallback)
      },
    })
  })
}

function readContent(data: unknown) {
  const body = typeof data === 'string' ? safeParse(data) : data
  if (!body || typeof body !== 'object') return ''
  const choices = (body as { choices?: { message?: { content?: unknown } }[] }).choices
  const content = choices?.[0]?.message?.content
  return typeof content === 'string' ? content : ''
}

function safeParse(raw: string) {
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

function sanitize(raw: string) {
  let text = raw.trim().split(/\r?\n/)[0]?.trim() ?? ''
  text = text.replace(/^小芽[:：]\s*/, '')
  text = text.replace(/^[“"「『]|[”"」』]$/g, '').trim()
  if (!text || [...text].length > 16) return ''
  return text
}
