import type { Profile, WorkStatus } from '../types';
import { isDefaultOffDay, isHolidayOff, isHolidayWork } from './holidays';

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

export function parseHHmm(value: string): { hours: number; minutes: number } {
  const [hours, minutes] = value.split(':').map(Number)
  return { hours: hours || 0, minutes: minutes || 0 }
}

export function hhmmToSeconds(hhmm: string): number {
  const { hours, minutes } = parseHHmm(hhmm)
  return hours * 3600 + minutes * 60
}

export function atTime(base: Date, hhmm: string): Date {
  const { hours, minutes } = parseHHmm(hhmm)
  const next = new Date(base)
  next.setHours(hours, minutes, 0, 0)
  return next
}

export function secondsBetween(from: Date, to: Date): number {
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / 1000))
}

export function overlapSeconds(fromA: Date, toA: Date, fromB: Date, toB: Date): number {
  const from = Math.max(fromA.getTime(), fromB.getTime())
  const to = Math.min(toA.getTime(), toB.getTime())
  return Math.max(0, Math.floor((to - from) / 1000))
}

export function workSecondsFromTimes(
  startTime: string,
  endTime: string,
  lunchStartTime: string,
  lunchEndTime: string,
): number {
  const span = hhmmToSeconds(endTime) - hhmmToSeconds(startTime)
  const lunch = Math.max(0, hhmmToSeconds(lunchEndTime) - hhmmToSeconds(lunchStartTime))
  return Math.max(1, span - lunch)
}

export function scheduleError(profile: Pick<Profile, 'startTime' | 'endTime' | 'lunchStartTime' | 'lunchEndTime'>): string {
  if (profile.endTime <= profile.startTime) return '下班时间需晚于上班时间'
  if (profile.lunchEndTime <= profile.lunchStartTime) return '午休结束需晚于开始时间'
  if (profile.lunchStartTime < profile.startTime || profile.lunchEndTime > profile.endTime) {
    return '午休需在上班和下班之间'
  }
  return ''
}

export function getStatus(now: Date, start: Date, lunchStart: Date, lunchEnd: Date, end: Date): WorkStatus {
  if (now.getTime() < start.getTime()) return 'before'
  if (now.getTime() >= end.getTime()) return 'after'
  if (now.getTime() >= lunchStart.getTime() && now.getTime() < lunchEnd.getTime()) return 'lunch'
  return 'working'
}

export function getWorkedSeconds(now: Date, start: Date, lunchStart: Date, lunchEnd: Date, end: Date, status: WorkStatus): number {
  const total = Math.max(1, secondsBetween(start, end) - secondsBetween(lunchStart, lunchEnd))
  if (status === 'before') return 0
  if (status === 'after') return total
  const elapsed = secondsBetween(start, now)
  const lunchTaken = overlapSeconds(start, now, lunchStart, lunchEnd)
  return Math.min(total, Math.max(0, elapsed - lunchTaken))
}

export function getRemainingSeconds(
  now: Date,
  start: Date,
  lunchStart: Date,
  lunchEnd: Date,
  end: Date,
  status: WorkStatus,
): number {
  if (status === 'before') return secondsBetween(now, start)
  if (status === 'after') return 0
  if (status === 'lunch') return secondsBetween(now, lunchEnd)
  const leftoverLunch = now.getTime() < lunchStart.getTime() ? secondsBetween(lunchStart, lunchEnd) : 0
  return Math.max(0, secondsBetween(now, end) - leftoverLunch)
}

export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const seconds = safe % 60
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, '0')).join(':')
}

export function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  if (hours <= 0) return `${minutes}分钟`
  if (minutes <= 0) return `${hours}小时`
  return `${hours}小时${minutes}分钟`
}

export function formatDateLabel(date: Date): string {
  return `${date.getMonth() + 1}月${date.getDate()}日 · ${WEEKDAYS[date.getDay()]}`
}

export function dailySalary(monthlySalary: number, workDaysPerMonth: number): number {
  return monthlySalary / Math.max(1, workDaysPerMonth)
}

export function wagesFromDaily(daily: number, totalDaySeconds: number) {
  const second = daily / Math.max(1, totalDaySeconds)
  return {
    hourly: second * 3600,
    minute: second * 60,
    second,
  }
}

export function dateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function isWeekday(date: Date): boolean {
  const day = date.getDay()
  return day !== 0 && day !== 6
}

export function isOfficialOffDay(date: Date): boolean {
  const key = dateKey(date)
  return isDefaultOffDay(date, key, !isWeekday(date))
}

export function isOffDay(date: Date, offDates: string[] = [], workDates: string[] = []): boolean {
  const key = dateKey(date)
  if (workDates.includes(key)) return false
  if (offDates.includes(key)) return true
  return isDefaultOffDay(date, key, !isWeekday(date))
}

export const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']

export interface MonthDay {
  key: string
  day: number
  isToday: boolean
  isWeekend: boolean
  isOff: boolean
  isHoliday: boolean
  isMakeup: boolean
}

export function buildMonthDays(
  now: Date,
  offDates: string[] = [],
  workDates: string[] = [],
): Array<MonthDay | null> {
  const year = now.getFullYear()
  const month = now.getMonth()
  const last = new Date(year, month + 1, 0).getDate()
  const pad = new Date(year, month, 1).getDay()
  const today = dateKey(now)
  const cells: Array<MonthDay | null> = Array.from({ length: pad }, () => null)
  for (let day = 1; day <= last; day += 1) {
    const date = new Date(year, month, day)
    const key = dateKey(date)
    cells.push({
      key,
      day,
      isToday: key === today,
      isWeekend: !isWeekday(date),
      isOff: isOffDay(date, offDates, workDates),
      isHoliday: isHolidayOff(key),
      isMakeup: isHolidayWork(key),
    })
  }
  return cells
}

export function countWeekdaysUntilYesterday(
  now: Date,
  offDates: string[] = [],
  workDates: string[] = [],
): number {
  const year = now.getFullYear()
  const month = now.getMonth()
  const today = now.getDate()
  let count = 0
  for (let day = 1; day < today; day += 1) {
    const date = new Date(year, month, day)
    if (!isOffDay(date, offDates, workDates)) count += 1
  }
  return count
}

export function countWorkDaysInMonth(
  now: Date,
  offDates: string[] = [],
  workDates: string[] = [],
): number {
  const year = now.getFullYear()
  const month = now.getMonth()
  const last = new Date(year, month + 1, 0).getDate()
  let count = 0
  for (let day = 1; day <= last; day += 1) {
    if (!isOffDay(new Date(year, month, day), offDates, workDates)) count += 1
  }
  return count
}

export function countWorkedDaysSoFar(
  now: Date,
  offDates: string[] = [],
  workDates: string[] = [],
  includeToday = false,
): number {
  return countWeekdaysUntilYesterday(now, offDates, workDates) + (includeToday ? 1 : 0)
}

export function monthTotal(
  now: Date,
  daily: number,
  todayEarned: number,
  workDaysPerMonth: number,
  offDates: string[] = [],
  workDates: string[] = [],
): number {
  const pastDays = Math.min(countWeekdaysUntilYesterday(now, offDates, workDates), workDaysPerMonth)
  return pastDays * daily + todayEarned
}

export function formatMoney(value: number, digits = 2): string {
  const safe = Number.isFinite(value) ? value : 0
  const negative = safe < 0
  const [intPart, fracPart] = Math.abs(safe).toFixed(digits).split('.')
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const body = fracPart === undefined ? grouped : `${grouped}.${fracPart}`
  return negative ? `-${body}` : body
}

export function formatWage(value: number, digits = 2): string {
  return formatMoney(value, digits)
}

export function statusLabel(status: WorkStatus): string {
  if (status === 'off') return '今天休息'
  if (status === 'before') return '未上班'
  if (status === 'after') return '已下班'
  if (status === 'lunch') return '午休中'
  return '正在上班'
}

export function heroTitle(status: WorkStatus): string {
  if (status === 'off') return '今日休息'
  if (status === 'before') return '距离上班还有'
  if (status === 'after') return '今日已收工'
  if (status === 'lunch') return '距离午休结束还有'
  return '距离下班还有'
}

export function heroSubtitle(status: WorkStatus): string {
  if (status === 'off') return '不算工时，好好过一天'
  if (status === 'before') return '先准备好，不慌不忙'
  if (status === 'after') return '今天也很棒，好好休息'
  if (status === 'lunch') return '先吃饭，这段时间不计薪'
  return '今天也快熬过去了 ♡'
}

export function companionText(status: WorkStatus, remaining: number): string {
  if (status === 'off') return '今天不上班，我陪你趴着。'
  if (status === 'before') return '还没开工，我先趴一会儿。'
  if (status === 'after') return '收工啦，今天也辛苦了。'
  if (status === 'lunch') return '午休中，先吃饭，我看着点。'
  const left = formatDuration(remaining)
  if (remaining >= 4 * 3600) return `还有 ${left}，行吧，我陪你。`
  if (remaining >= 3600) return `还有 ${left}，后半段了，稳住。`
  return `还有 ${left}，最后一公里。`
}

export function computeWorkDay(now: Date, profile: Profile) {
  const offDates = profile.offDates ?? []
  const workDates = profile.workDates ?? []
  const start = atTime(now, profile.startTime)
  const lunchStart = atTime(now, profile.lunchStartTime)
  const lunchEnd = atTime(now, profile.lunchEndTime)
  const end = atTime(now, profile.endTime)
  const total = workSecondsFromTimes(
    profile.startTime,
    profile.endTime,
    profile.lunchStartTime,
    profile.lunchEndTime,
  )
  const workDays = countWorkDaysInMonth(now, offDates, workDates)
  const daily = dailySalary(profile.monthlySalary, workDays)
  const wage = wagesFromDaily(daily, total)
  const pastWorkedDays = countWorkedDaysSoFar(now, offDates, workDates)

  if (isOffDay(now, offDates, workDates)) {
    return {
      start,
      lunchStart,
      lunchEnd,
      end,
      status: 'off' as const,
      total,
      worked: 0,
      remaining: 0,
      daily,
      wage,
      earned: 0,
      progress: 0,
      workDays,
      workedDays: pastWorkedDays,
      monthEarned: monthTotal(now, daily, 0, workDays, offDates, workDates),
    }
  }

  const status = getStatus(now, start, lunchStart, lunchEnd, end)
  const worked = getWorkedSeconds(now, start, lunchStart, lunchEnd, end, status)
  const remaining = getRemainingSeconds(now, start, lunchStart, lunchEnd, end, status)
  const earned = worked * wage.second
  const progress = Math.min(1, worked / total)
  const workedDays = countWorkedDaysSoFar(now, offDates, workDates, status !== 'before')

  return {
    start,
    lunchStart,
    lunchEnd,
    end,
    status,
    total,
    worked,
    remaining,
    daily,
    wage,
    earned,
    progress,
    workDays,
    workedDays,
    monthEarned: monthTotal(now, daily, earned, workDays, offDates, workDates),
  }
}
