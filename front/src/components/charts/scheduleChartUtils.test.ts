import type { ScheduleOptimizeResult } from '../../types'
import {
  getScheduleMonitorDateFromActiveAxisPointer,
  getScheduleMonitorDateFromChartEvent,
  getScheduleTrendMetricSummary
} from './scheduleChartUtils'

const assertEqual = (actual: unknown, expected: unknown) => {
  if (actual !== expected) {
    throw new Error(`Expected ${String(expected)}, received ${String(actual)}`)
  }
}

const makeSchedule = (): ScheduleOptimizeResult => ({
  plan: {
    id: 1,
    planName: 'monitor-test',
    startDate: '2026-07-01',
    endDate: '2026-07-03',
    planningDays: 3,
    targetAmount: 300,
    route: 'MXX'
  },
  dailyResults: [
    {
      date: '2026-07-01',
      dayIndex: 1,
      dayName: 'Wed',
      jb: 1,
      mxx: 2,
      ldx: 0,
      dnx: 4,
      sa: 5,
      fsa: 6,
      ylsn: 7,
      nx: 8,
      product: 90,
      mxxflc: 0,
      x2_2d: 0,
      cztg: 0,
      txxhcc: 0,
      yttg: 0,
      tg: 0
    },
    {
      date: '2026-07-02',
      dayIndex: 2,
      dayName: 'Thu',
      jb: 1,
      mxx: 2,
      ldx: 0,
      dnx: 4,
      sa: 5,
      fsa: 6,
      ylsn: 7,
      nx: 8,
      product: 100,
      mxxflc: 0,
      x2_2d: 0,
      cztg: 0,
      txxhcc: 0,
      yttg: 0,
      tg: 0
    },
    {
      date: '2026-07-03',
      dayIndex: 3,
      dayName: 'Fri',
      jb: 1,
      mxx: 2,
      ldx: 0,
      dnx: 4,
      sa: 5,
      fsa: 6,
      ylsn: 7,
      nx: 8,
      product: 110,
      mxxflc: 0,
      x2_2d: 0,
      cztg: 0,
      txxhcc: 0,
      yttg: 0,
      tg: 0
    }
  ],
  projectsByDate: {}
})

function run() {
  const schedule = makeSchedule()

  assertEqual(getScheduleMonitorDateFromChartEvent(schedule, { dataIndex: 1 }), '2026-07-02')
  assertEqual(getScheduleMonitorDateFromChartEvent(schedule, { dataIndex: -1 }), null)
  assertEqual(
    getScheduleMonitorDateFromActiveAxisPointer(schedule, { value: '2026-07-02', pixelX: 120 }, 130),
    '2026-07-02'
  )
  assertEqual(
    getScheduleMonitorDateFromActiveAxisPointer(schedule, { value: 2, pixelX: 120 }, 130),
    '2026-07-03'
  )
  assertEqual(
    getScheduleMonitorDateFromActiveAxisPointer(schedule, { value: '2026-07-02', pixelX: 120 }, 150),
    null
  )

  const summary = getScheduleTrendMetricSummary(schedule.dailyResults, 'product')
  assertEqual(summary.max.value, 110)
  assertEqual(summary.max.date, '2026-07-03')
  assertEqual(summary.min.value, 90)
  assertEqual(summary.min.date, '2026-07-01')
  assertEqual(summary.average, 100)
  assertEqual(summary.range, 20)
}

run()
