export type WorkStatus = 'before' | 'working' | 'lunch' | 'awaiting' | 'overtime' | 'after' | 'off'

export type WeekendRule = 'double' | 'offSat' | 'offSun' | 'bigSmall'

export interface WeekendSchedule {
  weekendRule?: WeekendRule
  bigWeekAnchor?: string
}

export interface GoodsItem {
  id: string
  name: string
  price: number
  unit: string
}

export interface OwnedItem {
  id: string
  name: string
  price: number
}

export interface FixedCost {
  id: string
  name: string
  price: number
}

export interface OvertimeEntry {
  minutes: number
  hourly?: number
  startTime?: string
}

export type OvertimeMap = Record<string, OvertimeEntry>

export interface Profile {
  monthlySalary: number
  workDaysPerMonth: number
  startTime: string
  endTime: string
  lunchStartTime: string
  lunchEndTime: string
  hasLunch: boolean
  memo: string
  goods: GoodsItem[]
  belongings: OwnedItem[]
  fixedCosts: FixedCost[]
  offDates: string[]
  workDates: string[]
  overtime: OvertimeMap
  weekendRule: WeekendRule
  bigWeekAnchor: string
  salaryReady: boolean
  showAfterCosts: boolean
}
