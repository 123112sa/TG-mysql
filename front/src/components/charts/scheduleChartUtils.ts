import dayjs from 'dayjs'
import type { DailyScheduleResult, ScheduleOptimizeResult } from '../../types'

export type ScheduleTrendMetricField =
  | 'product'
  | 'jb'
  | 'mxx'
  | 'ldx'
  | 'dnx'
  | 'sa'
  | 'fsa'
  | 'ylsn'
  | 'nx'

type ScheduleChartEvent = {
  dataIndex?: number
}

type ActiveAxisPointer = {
  value: string | number
  pixelX: number
}

export const formatProgressPercent = (value: number) => {
  const rounded = Number(value.toFixed(1))
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}%`
}

export function getScheduleProgressRows(schedule: ScheduleOptimizeResult) {
  const targetAmount = Number(schedule.plan.targetAmount || 0)
  let cumulativeAmount = 0

  return schedule.dailyResults.map((item, index) => {
    cumulativeAmount += Number(item.product || 0)
    const actualProgress =
      targetAmount > 0 ? Math.min((cumulativeAmount / targetAmount) * 100, 100) : 0
    const baselineProgress =
      schedule.dailyResults.length > 0
        ? ((index + 1) / schedule.dailyResults.length) * 100
        : 0

    return {
      ...item,
      cumulativeAmount,
      actualProgress,
      baselineProgress,
      deviation: actualProgress - baselineProgress
    }
  })
}

export function getScheduleMonitorDateFromChartEvent(
  schedule: ScheduleOptimizeResult,
  event: ScheduleChartEvent
) {
  const dataIndex = Number(event.dataIndex)
  if (!Number.isInteger(dataIndex) || dataIndex < 0) {
    return null
  }

  return getScheduleProgressRows(schedule)[dataIndex]?.date || null
}

export function getScheduleMonitorDateFromActiveAxisPointer(
  schedule: ScheduleOptimizeResult,
  axisPointer: ActiveAxisPointer | null,
  clickX: number,
  maxPixelDistance = 24
) {
  const rows = getScheduleProgressRows(schedule)
  if (
    rows.length === 0 ||
    !axisPointer ||
    !Number.isFinite(axisPointer.pixelX) ||
    !Number.isFinite(clickX)
  ) {
    return null
  }

  if (Math.abs(clickX - axisPointer.pixelX) > maxPixelDistance) {
    return null
  }

  if (typeof axisPointer.value === 'string') {
    const matched = rows.find((item) => item.date === axisPointer.value)
    if (matched) {
      return matched.date
    }
  }

  const index = Number(axisPointer.value)
  if (!Number.isInteger(index) || index < 0 || index >= rows.length) {
    return null
  }

  return rows[index]?.date || null
}

export function getScheduleMonitorStats(
  schedule: ScheduleOptimizeResult,
  activeDate: string
) {
  const rows = getScheduleProgressRows(schedule)
  const targetAmount = Number(schedule.plan.targetAmount || 0)
  const today = dayjs().format('YYYY-MM-DD')

  let currentIndex = rows.findIndex((item) => item.date === activeDate)
  if (currentIndex < 0) currentIndex = rows.findIndex((item) => item.date === today)
  if (currentIndex < 0) {
    currentIndex = rows.findIndex((item) => item.date > today)
    currentIndex = currentIndex < 0 ? rows.length - 1 : Math.max(currentIndex - 1, 0)
  }

  const current = rows[Math.max(currentIndex, 0)] || rows[rows.length - 1]
  const completedAmount = current ? current.cumulativeAmount : 0
  const actualProgress = current ? current.actualProgress : 0
  const baselineProgress = current ? current.baselineProgress : 0
  const deviation = actualProgress - baselineProgress

  const status =
    deviation >= 3
      ? { text: '进度超前', tone: 'ahead' as const }
      : deviation <= -3
        ? { text: '进度滞后', tone: 'behind' as const }
        : { text: '进度正常', tone: 'normal' as const }

  const estimatedCompletion =
    rows.find((item) => item.cumulativeAmount >= targetAmount)?.date ||
    schedule.plan.endDate

  return {
    rows,
    completedAmount,
    remainingAmount: Math.max(targetAmount - completedAmount, 0),
    actualProgress,
    baselineProgress,
    deviation,
    status,
    estimatedCompletion
  }
}

export function getScheduleTrendMetricSummary(
  dailyResults: DailyScheduleResult[],
  metricKey: ScheduleTrendMetricField
) {
  const values = dailyResults.map((item) => ({
    date: item.date,
    value: Number(item[metricKey] || 0)
  }))

  if (values.length === 0) {
    return {
      max: { date: '', value: 0 },
      min: { date: '', value: 0 },
      average: 0,
      range: 0
    }
  }

  const max = values.reduce((best, item) => (item.value > best.value ? item : best), values[0])
  const min = values.reduce((best, item) => (item.value < best.value ? item : best), values[0])
  const total = values.reduce((sum, item) => sum + item.value, 0)
  const average = total / values.length

  return {
    max,
    min,
    average,
    range: max.value - min.value
  }
}
