export type WorkStatus = 'before' | 'working' | 'lunch' | 'after' | 'off'

export interface GoodsItem {
  id: string
  name: string
  price: number
  unit: string
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
  offDates: string[]
  workDates: string[]
}
