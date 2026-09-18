import type { Profile, WeekendRule, WeekendSchedule, WorkStatus } from '../types';
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

export function hasLunchBreak(profile: { hasLunch?: boolean }): boolean {
  return profile.hasLunch !== false
}

export function workSecondsFromTimes(
  startTime: string,
  endTime: string,
  lunchStartTime: string,
  lunchEndTime: string,
  hasLunch = true,
): number {
  const span = hhmmToSeconds(endTime) - hhmmToSeconds(startTime)
  const lunch = hasLunch ? Math.max(0, hhmmToSeconds(lunchEndTime) - hhmmToSeconds(lunchStartTime)) : 0
  return Math.max(1, span - lunch)
}

export function scheduleError(
  profile: Pick<Profile, 'startTime' | 'endTime' | 'lunchStartTime' | 'lunchEndTime'> & { hasLunch?: boolean },
): string {
  if (profile.endTime <= profile.startTime) return '下班时间需晚于上班时间'
  if (!hasLunchBreak(profile)) return ''
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

function formatSpanParts(months: number, remDays: number): string {
  if (months <= 0) {
    if (remDays < 1) return '不到 1 天'
    if (remDays < 10) return `${remDays.toFixed(1)} 天`
    return `${Math.round(remDays)} 天`
  }
  if (months < 12) {
    if (remDays < 1) return `${months} 个月`
    return `${months} 个月 ${Math.round(remDays)} 天`
  }
  const years = Math.floor(months / 12)
  const remMonths = months % 12
  if (remMonths <= 0) return `${years} 年`
  return `${years} 年 ${remMonths} 个月`
}

function walkWorkSpan(
  workDaysNeeded: number,
  from: Date,
  offDates: string[] = [],
  workDates: string[] = [],
  schedule: WeekendSchedule = {},
): { months: number; remDays: number } {
  const thisMonthDays = countWorkDaysInMonth(from, offDates, workDates, schedule)
  if (workDaysNeeded < thisMonthDays) {
    return { months: 0, remDays: workDaysNeeded }
  }

  let remaining = workDaysNeeded
  let months = 0
  const cursor = new Date(from.getFullYear(), from.getMonth(), 1)
  const limit = 12 * 80

  while (remaining > 0 && months < limit) {
    const daysInMonth = countWorkDaysInMonth(cursor, offDates, workDates, schedule)
    if (daysInMonth > 0 && remaining <= daysInMonth) {
      const remDays = Math.round(remaining)
      if (remDays >= daysInMonth) return { months: months + 1, remDays: 0 }
      return { months, remDays }
    }
    remaining -= daysInMonth
    months += 1
    cursor.setMonth(cursor.getMonth() + 1)
  }

  return { months, remDays: 0 }
}

/** 按日历里每个月的实际上班天数，把要上的班换成天 / 月 / 年。 */
export function resolveWorkSpan(
  workDaysNeeded: number,
  from: Date,
  offDates: string[] = [],
  workDates: string[] = [],
  schedule: WeekendSchedule = {},
): { label: string; hint: string } {
  if (!(workDaysNeeded >= 1)) return { label: '不到 1 天', hint: '' }
  const { months, remDays } = walkWorkSpan(workDaysNeeded, from, offDates, workDates, schedule)
  const label = formatSpanParts(months, remDays)
  const hint = months > 0 ? `约 ${Math.round(workDaysNeeded)} 天` : ''
  return { label, hint }
}

export function formatWorkSpan(
  workDaysNeeded: number,
  from: Date,
  offDates: string[] = [],
  workDates: string[] = [],
  schedule: WeekendSchedule = {},
): string {
  return resolveWorkSpan(workDaysNeeded, from, offDates, workDates, schedule).label
}

export function formatDateLabel(date: Date): string {
  return `${date.getMonth() + 1}月${date.getDate()}日 · ${WEEKDAYS[date.getDay()]}`
}

export function dailySalary(monthlySalary: number, workDaysPerMonth: number): number {
  return monthlySalary / Math.max(1, workDaysPerMonth)
}

export function dailyFixedShare(monthlyTotal: number, workDays: number): number {
  if (!(workDays > 0)) return 0
  return Math.max(0, monthlyTotal) / workDays
}

export function monthlyFixedTotal(items: Array<{ price?: number }> = []): number {
  return items.reduce((sum, item) => sum + Math.max(0, Number(item.price) || 0), 0)
}

export function summarizeFixedCosts(
  items: Array<{ price?: number }>,
  workDays: number,
  earned: number,
  status: WorkStatus,
) {
  const monthly = monthlyFixedTotal(items)
  const daily = dailyFixedShare(monthly, workDays)
  return {
    monthly,
    daily,
    hasCosts: monthly > 0,
    net: earned - daily,
    gap: Math.max(0, daily - earned),
    covered: daily > 0 && earned >= daily,
    rest: status === 'off',
  }
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

export const WEEKEND_RULES: { id: WeekendRule; label: string }[] = [
  { id: 'double', label: '双休' },
  { id: 'offSat', label: '休周六' },
  { id: 'offSun', label: '休周日' },
  { id: 'bigSmall', label: '大小周' },
]

export function normalizeWeekendRule(raw: unknown): WeekendRule {
  if (raw === 'offSat' || raw === 'offSun' || raw === 'bigSmall') return raw
  return 'double'
}

export function weekendRuleLabel(rule: WeekendRule): string {
  return WEEKEND_RULES.find((item) => item.id === rule)?.label ?? '双休'
}

export function restScheduleFrom(
  profile?: Pick<Profile, 'weekendRule' | 'bigWeekAnchor'>,
): WeekendSchedule {
  return {
    weekendRule: normalizeWeekendRule(profile?.weekendRule),
    bigWeekAnchor: typeof profile?.bigWeekAnchor === 'string' ? profile.bigWeekAnchor : '',
  }
}

function parseDateKey(value?: string): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function mondayOf(date: Date): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const dow = next.getDay()
  next.setDate(next.getDate() + (dow === 0 ? -6 : 1 - dow))
  return next
}

function mondayIndex(date: Date): number {
  const monday = mondayOf(date)
  return Math.round(Date.UTC(monday.getFullYear(), monday.getMonth(), monday.getDate()) / 604800000)
}

export function isBigWeek(date: Date, bigWeekAnchor?: string): boolean {
  const anchor = parseDateKey(bigWeekAnchor)
  if (!anchor) return true
  return mondayIndex(date) % 2 === mondayIndex(anchor) % 2
}

export function isScheduleOffDay(date: Date, schedule: WeekendSchedule = {}): boolean {
  const rule = normalizeWeekendRule(schedule.weekendRule)
  const dow = date.getDay()
  if (rule === 'offSat') return dow === 6
  if (rule === 'offSun') return dow === 0
  if (rule === 'bigSmall') return isBigWeek(date, schedule.bigWeekAnchor) ? dow === 0 : dow === 0 || dow === 6
  return dow === 0 || dow === 6
}

export function isWeekday(date: Date): boolean {
  const day = date.getDay()
  return day !== 0 && day !== 6
}

export function isOfficialOffDay(date: Date, schedule: WeekendSchedule = {}): boolean {
  const key = dateKey(date)
  return isDefaultOffDay(date, key, isScheduleOffDay(date, schedule))
}

export function isOffDay(
  date: Date,
  offDates: string[] = [],
  workDates: string[] = [],
  schedule: WeekendSchedule = {},
): boolean {
  const key = dateKey(date)
  if (workDates.includes(key)) return false
  if (offDates.includes(key)) return true
  return isOfficialOffDay(date, schedule)
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
  schedule: WeekendSchedule = {},
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
      isWeekend: isScheduleOffDay(date, schedule),
      isOff: isOffDay(date, offDates, workDates, schedule),
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
  schedule: WeekendSchedule = {},
): number {
  const year = now.getFullYear()
  const month = now.getMonth()
  const today = now.getDate()
  let count = 0
  for (let day = 1; day < today; day += 1) {
    const date = new Date(year, month, day)
    if (!isOffDay(date, offDates, workDates, schedule)) count += 1
  }
  return count
}

export function countWorkDaysInMonth(
  now: Date,
  offDates: string[] = [],
  workDates: string[] = [],
  schedule: WeekendSchedule = {},
): number {
  const year = now.getFullYear()
  const month = now.getMonth()
  const last = new Date(year, month + 1, 0).getDate()
  let count = 0
  for (let day = 1; day <= last; day += 1) {
    if (!isOffDay(new Date(year, month, day), offDates, workDates, schedule)) count += 1
  }
  return count
}

export function countWorkedDaysSoFar(
  now: Date,
  offDates: string[] = [],
  workDates: string[] = [],
  includeToday = false,
  schedule: WeekendSchedule = {},
): number {
  return countWeekdaysUntilYesterday(now, offDates, workDates, schedule) + (includeToday ? 1 : 0)
}

export function monthTotal(
  now: Date,
  daily: number,
  todayEarned: number,
  workDaysPerMonth: number,
  offDates: string[] = [],
  workDates: string[] = [],
  schedule: WeekendSchedule = {},
): number {
  const pastDays = Math.min(countWeekdaysUntilYesterday(now, offDates, workDates, schedule), workDaysPerMonth)
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
  const schedule = restScheduleFrom(profile)
  const start = atTime(now, profile.startTime)
  const lunchOn = hasLunchBreak(profile)
  const lunchStart = lunchOn ? atTime(now, profile.lunchStartTime) : start
  const lunchEnd = lunchOn ? atTime(now, profile.lunchEndTime) : start
  const end = atTime(now, profile.endTime)
  const total = workSecondsFromTimes(
    profile.startTime,
    profile.endTime,
    profile.lunchStartTime,
    profile.lunchEndTime,
    lunchOn,
  )
  const workDays = countWorkDaysInMonth(now, offDates, workDates, schedule)
  const daily = dailySalary(profile.monthlySalary, workDays)
  const wage = wagesFromDaily(daily, total)
  const monthlyFixed = monthlyFixedTotal(profile.fixedCosts)
  const dailyFixed = dailyFixedShare(monthlyFixed, workDays)
  const netDaily = daily - dailyFixed
  const netWage = wagesFromDaily(netDaily, total)
  const pastWorkedDays = countWorkedDaysSoFar(now, offDates, workDates, false, schedule)
  const payExtra = {
    monthlyFixed,
    dailyFixed,
    hasFixedCosts: monthlyFixed > 0,
    netDaily,
    netWage,
  }

  if (isOffDay(now, offDates, workDates, schedule)) {
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
      monthEarned: monthTotal(now, daily, 0, workDays, offDates, workDates, schedule),
      netEarned: 0,
      netMonthEarned: monthTotal(now, netDaily, 0, workDays, offDates, workDates, schedule),
      ...payExtra,
    }
  }

  const status = getStatus(now, start, lunchStart, lunchEnd, end)
  const worked = getWorkedSeconds(now, start, lunchStart, lunchEnd, end, status)
  const remaining = getRemainingSeconds(now, start, lunchStart, lunchEnd, end, status)
  const earned = worked * wage.second
  const netEarned = worked * netWage.second
  const progress = Math.min(1, worked / total)
  const workedDays = countWorkedDaysSoFar(now, offDates, workDates, status !== 'before', schedule)

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
    monthEarned: monthTotal(now, daily, earned, workDays, offDates, workDates, schedule),
    netEarned,
    netMonthEarned: monthTotal(now, netDaily, netEarned, workDays, offDates, workDates, schedule),
    ...payExtra,
  }
}
