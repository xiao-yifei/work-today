export type WorkStatus = 'before' | 'working' | 'lunch' | 'after' | 'off'

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

export interface FixedCost {
  id: string
  name: string
  price: number
}

export interface Profile {
  monthlySalary: number
  workDaysPerMonth: number
  startTime: string
  endTime: string
  lunchStartTime: string
  lunchEndTime: string
  memo: string
  goods: GoodsItem[]
  fixedCosts: FixedCost[]
  offDates: string[]
  workDates: string[]
  weekendRule: WeekendRule
  bigWeekAnchor: string
}
