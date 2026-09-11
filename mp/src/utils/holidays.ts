function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function dateKeyFromParts(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`
}

function range(year: number, startMonth: number, startDay: number, endMonth: number, endDay: number): string[] {
  const keys: string[] = []
  const cursor = new Date(year, startMonth - 1, startDay)
  const end = new Date(year, endMonth - 1, endDay)
  while (cursor.getTime() <= end.getTime()) {
    keys.push(dateKeyFromParts(cursor.getFullYear(), cursor.getMonth() + 1, cursor.getDate()))
    cursor.setDate(cursor.getDate() + 1)
  }
  return keys
}

/** 国务院办公厅放假安排：2025 国办发明电〔2024〕12号，2026 国办发明电〔2025〕7号 */
const HOLIDAY_OFF = new Set<string>([
  '2025-01-01',
  ...range(2025, 1, 28, 2, 4),
  ...range(2025, 4, 4, 4, 6),
  ...range(2025, 5, 1, 5, 5),
  ...range(2025, 5, 31, 6, 2),
  ...range(2025, 10, 1, 10, 8),
  ...range(2026, 1, 1, 1, 3),
  ...range(2026, 2, 15, 2, 23),
  ...range(2026, 4, 4, 4, 6),
  ...range(2026, 5, 1, 5, 5),
  ...range(2026, 6, 19, 6, 21),
  ...range(2026, 9, 25, 9, 27),
  ...range(2026, 10, 1, 10, 7),
])

const HOLIDAY_WORK = new Set<string>([
  '2025-01-26',
  '2025-02-08',
  '2025-04-27',
  '2025-09-28',
  '2025-10-11',
  '2026-01-04',
  '2026-02-14',
  '2026-02-28',
  '2026-05-09',
  '2026-09-20',
  '2026-10-10',
])

export function isHolidayOff(key: string): boolean {
  return HOLIDAY_OFF.has(key)
}

export function isHolidayWork(key: string): boolean {
  return HOLIDAY_WORK.has(key)
}

export function isDefaultOffDay(_date: Date, key: string, isWeekend: boolean): boolean {
  if (isHolidayWork(key)) return false
  if (isHolidayOff(key)) return true
  return isWeekend
}
